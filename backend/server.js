require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Rotaları (Yolları) içe aktar
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts'); // YENİ: İlan rotası eklendi

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Başarıyla Bağlandı! (Hafıza Merkezi Aktif)'))
  .catch((err) => console.log('❌ MongoDB Bağlantı Hatası:', err));

// Rotaları Kullan
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute); // YENİ: İlan rotası aktif edildi

// Test Rotası
app.get('/', (req, res) => {
  res.send('SinerjiHub Backend API Çalışıyor! 🚀');
});

// Sunucuyu Başlat
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor... Kervan yolda!`);
});