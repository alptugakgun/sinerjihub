const mongoose = require('mongoose');

// Kullanıcı Şablonumuz (SinerjiHub Profil İskeleti)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false, // İlk etapta sadece e-posta ile kayıt yaptırabiliriz diye esnek bıraktım
  },
  email: {
    type: String,
    required: true,
    unique: true, // Aynı e-posta ile iki kişi kayıt olamaz
  },
  password: {
    type: String,
    required: true,
  },
  // Onboarding (Buzkıran) ekranından gelecek veriler
  roles: {
    type: [String], // Örn: ["yazilimci", "ogrenci"]
    default: [],
  },
  interests: {
    type: [String], // Örn: ["React.js", "GTA 5 RP"]
    default: [],
  },
  // Oyunlaştırma ve İtibar Sistemi
  karmaPoints: {
    type: Number,
    default: 10, // Yeni başlayanlara 10 puan hediye :)
  },
  createdAt: {
    type: Date,
    default: Date.now, // Ne zaman kabileye katıldığını otomatik kaydeder
  }
});

// Şablonu dışa aktar ki beynimiz (server.js) bunu kullanabilsin
module.exports = mongoose.model('User', userSchema);