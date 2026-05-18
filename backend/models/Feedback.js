const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['İstek', 'Öneri', 'Hata Bildirimi', 'Diğer'],
    default: 'Öneri'
  },
  status: {
    type: String,
    enum: ['Beklemede', 'İncelendi', 'Tamamlandı'],
    default: 'Beklemede'
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Feedback', FeedbackSchema);