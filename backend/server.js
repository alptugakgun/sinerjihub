require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookie = require('cookie'); // Cookie'den token okumak için (zaten dependency'de mevcut)

// --- GÜVENLİK ZORUNLULUĞU: JWT_SECRET olmadan sunucu asla ayağa kalkmasın ---
// Eskiden auth.js içinde bir fallback secret vardı, bu tehlikeliydi.
// .env eksikse artık sunucuyu hiç başlatmıyoruz.
if (!process.env.JWT_SECRET) {
  console.error('❌ KRİTİK HATA: .env dosyasında JWT_SECRET tanımlı değil. Sunucu başlatılamıyor.');
  process.exit(1);
}

// YENİ: Gerçek zamanlı iletişim için gerekli modüller
const http = require('http'); 
const { Server } = require('socket.io'); 

const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const hubRoute = require('./routes/hubs');
const notificationRoute = require('./routes/notifications');
const messageRoute = require('./routes/messages');
const socialRoute = require('./routes/social');
const adminRoute = require('./routes/admin'); 
const feedbackRoute = require('./routes/feedback'); 
const storyRoute = require('./routes/stories'); // Route tanımlaması burada kalsın

// YENİ EKLENEN: Kabile veritabanı modelini sunucuya çağırıyoruz
const Hub = require('./models/Hub'); 

const app = express(); // <--- İŞTE APP BURADA DOĞDU!

// YENİ: Express'i bir HTTP sunucusuna sarıyoruz
const server = http.createServer(app); 

// YENİ: Socket.io motorunu sunucuya entegre ediyoruz
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// GÜVENLİK: origin '*' ile credentials birlikte çalışmaz (tarayıcılar reddeder).
// Frontend'in gerçek adresini FRONTEND_URL olarak .env'e ekle (örn. https://sinerjihub.vercel.app).
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// --- DOSYA BOYUT LİMİTİ ARTIRIMI (Kabile Arşivi İçin Hayati Önem Taşır) ---
// Base64 formatındaki resimlerin ve dosyaların reddedilmemesi için limiti 10MB yapıyoruz
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Gelen isteklerdeki cookie header'ını okuyup req.cookies olarak sunuyoruz
// (verifyToken middleware'i bunu httpOnly 'token' cookie'sini okumak için kullanıyor)
app.use((req, res, next) => {
  req.cookies = cookie.parse(req.headers.cookie || '');
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Başarıyla Bağlandı!'))
  .catch((err) => console.log('❌ MongoDB Bağlantı Hatası:', err));

// APP DOĞDUKTAN SONRA KULLANILACAK OLAN ROTALAR:
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/hubs', hubRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/messages', messageRoute);
app.use('/api/social', socialRoute);
app.use('/api/admin', adminRoute); 
app.use('/api/feedback', feedbackRoute); 
app.use('/api/stories', storyRoute); // <--- HATA VEREN SATIRI DOĞRU YERE ALDIK!

// --- YENİ: SOCKET.IO GERÇEK ZAMANLI OLAY YÖNETİCİSİ ---

// Aktif (online) kullanıcıları tutacağımız geçici hafıza
let onlineUsers = [];

const addNewUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

// Biri siteye bağlandığında (Socket bağlantısı kurulduğunda)
io.on("connection", (socket) => {
  console.log(`⚡ Bir kullanıcı canlı ağa bağlandı: ${socket.id}`);

  // --- YENİ: SIFIR BÜTÇE WEBRTC SİNYAL AKTARICISI ---
  socket.on("join-voice-room", ({ hubId, peerId }) => {
    // Sinyali o an sadece o Kabile (Hub) odasında olanlara bağırıyoruz
    socket.broadcast.to(hubId).emit("user-connected-voice", peerId);
    console.log(`🎙️ Kabile ${hubId} odasında yeni canlı bağlantı: ${peerId}`);
  });
  
  // 1. Yeni kullanıcı giriş yaptığında onu listeye ekle
  socket.on("newUser", (userId) => {
    addNewUser(userId, socket.id);
    console.log("Aktif Sinerji Üyeleri:", onlineUsers);
  });

  // 2. Birebir Mesaj (DM) Gönderildiğinde
  socket.on("sendDm", ({ senderId, receiverId, content }) => {
    const receiver = getUser(receiverId);
    // Eğer karşı taraf o an sitedeyse, mesajı direkt ekranına fırlat
    if (receiver) {
      io.to(receiver.socketId).emit("getDm", {
        sender: senderId,
        content,
        createdAt: Date.now()
      });
    }
  });
  
  // --- SİNERJİ CANLI KOD LABORATUVARI SOKETİ ---
  socket.on("sendCodeUpdate", ({ hubId, code }) => {
  // Kodu yazan hariç, odadaki herkese yeni kodu anında fırlatır
  socket.to(hubId).emit("receiveCodeUpdate", code); 
  });

  
  // 3. Kabile (Hub) Odasına Mesaj Gönderildiğinde
  // DİKKAT: Artık bu işlem veritabanı (async) kaydı barındırıyor!
  socket.on("sendHubMessage", async (data) => {
    // Mesajı o odaya bağlı olan diğer herkese anlık gönder (Dosya bilgilerini de içerecek şekilde)
    socket.broadcast.to(data.hubId).emit("getHubMessage", {
      user: data.senderId,
      username: data.username,
      content: data.content,
      attachment: data.attachment,
      attachmentName: data.attachmentName,
      attachmentType: data.attachmentType,
      createdAt: Date.now()
    });

    // --- YENİ EKLENEN: MESAJI VERİTABANINA (ARŞİVE) KAYDET ---
    try {
      await Hub.findByIdAndUpdate(data.hubId, {
        $push: {
          messages: {
            senderId: data.senderId,
            username: data.username,
            content: data.content,
            attachment: data.attachment,
            attachmentName: data.attachmentName,
            attachmentType: data.attachmentType,
            createdAt: Date.now()
          }
        }
      });
      console.log(`💾 Mesaj Kabile ${data.hubId} arşivine kalıcı olarak işlendi.`);
    } catch (err) {
      console.error("Mesaj Kabile arşivine kaydedilirken hata oluştu:", err);
    }
  });

  // 4. Kabile Odasına (Room) Katılma Olayı
  socket.on("joinHubRoom", (hubId) => {
    socket.join(hubId);
    console.log(`Kullanıcı ${socket.id}, ${hubId} kabilesine girdi.`);
  });

  // 5. Kullanıcı siteden çıktığında
  socket.on("disconnect", () => {
    console.log(`🔌 Bir kullanıcı ağdan koptu: ${socket.id}`);
    removeUser(socket.id);
  });
});

app.get('/', (req, res) => { res.send('SinerjiHub Canlı API Aktif! 🚀'); });

// DİKKAT: Artık app.listen değil, server.listen kullanıyoruz!
server.listen(PORT, () => { console.log(`🚀 Sunucu ${PORT} portunda, CANLI bağlantılarla çalışıyor...`); });