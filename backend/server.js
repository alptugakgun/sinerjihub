require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- ROTALARI (ROUTES) İÇE AKTAR ---
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const hubRoute = require('./routes/hubs');
const notificationRoute = require('./routes/notifications');
const messageRoute = require('./routes/messages');
const socialRoute = require('./routes/social'); // Arkadaşlık ve Sosyal Ağ Rotası

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
// CORS ayarları frontend ile backend arasındaki iletişimi sağlar
app.use(cors());
// Gelen JSON verilerini okumamızı sağlar
app.use(express.json());

// --- MONGODB BAĞLANTISI ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Başarıyla Bağlandı! SinerjiHub Veri Merkezi Aktif.');
  })
  .catch((err) => {
    console.log('❌ MongoDB Bağlantı Hatası:', err);
  });

// --- ROTALARI KULLAN (API ENDPOINTS) ---
// Her bir modül kendi yolu üzerinden çalışır
app.use('/api/auth', authRoute);           // Kayıt ve Giriş İşlemleri
app.use('/api/posts', postRoute);         // İlan ve Upvote İşlemleri
app.use('/api/hubs', hubRoute);           // Kabile İşlemleri
app.use('/api/notifications', notificationRoute); // Bildirim Merkezi
app.use('/api/messages', messageRoute);   // Birebir Mesajlaşma (DM)
app.use('/api/social', socialRoute);       // Arkadaşlık Sistemi

// --- ANA TEST ROTASI ---
app.get('/', (req, res) => {
  res.send('SinerjiHub Backend API Sorunsuz Çalışıyor! 🚀');
});

// --- SUNUCUYU BAŞLAT ---
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda başarıyla ayağa kalktı...`);
  console.log(`🌍 Kahramanmaraş'tan Dünyaya Sinerji Yayılıyor!`);
});