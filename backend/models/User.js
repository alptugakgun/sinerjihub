const mongoose = require('mongoose');

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
  // YENİ: Kullanıcının katıldığı kabilelerin ID listesi
  hubs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', UserSchema);