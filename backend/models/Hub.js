const mongoose = require('mongoose');

// SinerjiHub Kabile (Hub) Şablonu
const HubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: "🔥"
  },
  // Kabileye dahil olan tüm gezginlerin ID listesi
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  
  // --- ÖZEL VE ŞİFRELİ ODA AYARLARI ---
  isPrivate: {
    type: Boolean,
    default: false
  },
  passcode: {
    type: String,
    default: ""
  },
  // Odayı kuran yetkili kullanıcının ID'si (Gelişmiş yönetim için)
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // --- YENİ EKLENEN: KABİLE MESAJ ARŞİVİ (HUB MESSAGE PERSISTENCE) ---
  // Odada dönen tüm Sinerji sohbetlerini kalıcı olarak bu dizide saklayacağız.
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String },
      content: { type: String },
      attachment: { type: String }, // Base64 dosya formatı
      attachmentName: { type: String },
      attachmentType: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hub', HubSchema);