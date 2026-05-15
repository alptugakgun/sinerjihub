const mongoose = require('mongoose');

const DirectMessageSchema = new mongoose.Schema({
  // Mesajı kim gönderdi?
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Mesaj kime gidiyor?
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);