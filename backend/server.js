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
// Frontend'in birden fazla adresi olabileceği için izin verilen origin'leri bir dizi (array) olarak tanımlıyoruz.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://sinerjihub.vercel.app',
  'https://sinerjicommunity.site'
];

app.use(cors({
  origin: function (origin, callback) {
    // Postman gibi araçlardan gelen (origin undefined) isteklere veya izinli listedeki domainlere izin ver.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS Engellendi: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
require('./sockets/socketManager')(io);

app.get('/', (req, res) => { res.send('SinerjiHub Canlı API Aktif! 🚀'); });

// DİKKAT: Artık app.listen değil, server.listen kullanıyoruz!
server.listen(PORT, () => { console.log(`🚀 Sunucu ${PORT} portunda, CANLI bağlantılarla çalışıyor...`); });