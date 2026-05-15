const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Bildirimin kime gideceği
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Bildirimi tetikleyen kişi (Örn: Ahmet senin ilanını destekledi)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Bildirimin türü (upvote, join_hub, system_message vb.)
  type: {
    type: String,
    required: true
  },
  // Ekranda görünecek mesaj
  message: {
    type: String,
    required: true
  },
  // Bildirim okundu mu?
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);