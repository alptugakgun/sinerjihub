require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Rotalar
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const hubRoute = require('./routes/hubs'); // YENİ: Kabile rotası

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Başarıyla Bağlandı!'))
  .catch((err) => console.log('❌ MongoDB Bağlantı Hatası:', err));

app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/hubs', hubRoute); // YENİ: Kabile yolu aktif

app.get('/', (req, res) => {
  res.send('SinerjiHub Backend API Çalışıyor! 🚀');
});

app.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`);
});