require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Gelen verileri anlaması ve güvenlik için)
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Başarıyla Bağlandı! (Hafıza Merkezi Aktif)'))
  .catch((err) => console.log('❌ MongoDB Bağlantı Hatası:', err));

// Test Rotası (Motor çalışıyor mu diye bakmak için)
app.get('/', (req, res) => {
  res.send('SinerjiHub Backend API Çalışıyor! 🚀');
});

// Sunucuyu Başlat
app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor... Kervan yolda!`);
});