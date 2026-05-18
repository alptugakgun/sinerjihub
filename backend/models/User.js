const mongoose = require('mongoose');

// SinerjiHub Kullanıcı Şablonu
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // ADMİN PANELİNDEN YÖNETİLECEK RÜTBELER (Örn: Kurucu, Moderatör, Gamer)
  roles: {
    type: [String],
    default: ["Gezgin"] 
  },
  interests: {
    type: [String],
    default: []
  },
  karmaPoints: {
    type: Number,
    default: 10
  },
  // YENİ: Profil Fotoğrafı (Base64 formatında metin olarak tutulacak)
  profilePicture: {
    type: String,
    default: ""
  },
  hubs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub'
    }
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  friendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  sentRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', UserSchema);