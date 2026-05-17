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
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hub', HubSchema);