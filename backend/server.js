require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// YENİ: Gerçek zamanlı iletişim için gerekli modüller
const http = require('http'); 
const { Server } = require('socket.io'); 

const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const hubRoute = require('./routes/hubs');
const notificationRoute = require('./routes/notifications');
const messageRoute = require('./routes/messages');
const socialRoute = require('./routes/social');

const app = express();

// YENİ: Express'i bir HTTP sunucusuna sarıyoruz
const server = http.createServer(app); 

// YENİ: Socket.io motorunu sunucuya entegre ediyoruz
const io = new Server(server, {
  cors: {
    origin: "*", // Şimdilik tüm kaynaklara açık. İleride sadece frontend linkini koyabiliriz.
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Başarıyla Bağlandı!'))
  .catch((err) => console.log('❌ MongoDB Bağlantı Hatası:', err));

app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/hubs', hubRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/messages', messageRoute);
app.use('/api/social', socialRoute);

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

  // 3. Kabile (Hub) Odasına Mesaj Gönderildiğinde
  socket.on("sendHubMessage", ({ hubId, senderId, username, content }) => {
    // Mesajı o odaya bağlı olan diğer herkese anlık gönder
    socket.broadcast.to(hubId).emit("getHubMessage", {
      user: senderId,
      username: username,
      content: content,
      createdAt: Date.now()
    });
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