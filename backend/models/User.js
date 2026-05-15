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
  roles: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  karmaPoints: {
    type: Number,
    default: 10
  },
  // Kullanıcının katıldığı kabilelerin ID listesi
  hubs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub'
    }
  ],
  // YENİ: Arkadaşlık Sistemi Alanları (Kısaltılmamış tam hali)
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
  ], // Kullanıcıya gelen istekler
  sentRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ], // Kullanıcının gönderdiği istekler
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', UserSchema);