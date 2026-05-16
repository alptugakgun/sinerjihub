const mongoose = require('mongoose');

// SinerjiHub Mesaj Şablonu (Hem DM hem de Kabile mesajları için ortak yapı)
const MessageSchema = new mongoose.Schema({
  // Kabile (Hub) mesajları için gerekli alanlar
  hubId: {
    type: String,
    required: false
  },
  user: {
    type: String, // Mesajı atan kişinin ID'si
    required: false
  },
  username: {
    type: String, // Ekranda hızlıca göstermek için isim
    required: false
  },

  // Birebir (DM) mesajlar için gerekli alanlar
  senderId: {
    type: String,
    required: false
  },
  receiverId: {
    type: String,
    required: false
  },

  // Ortak mesaj içeriği
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);