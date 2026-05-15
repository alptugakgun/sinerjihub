const mongoose = require('mongoose');

// Kabile Odası (Hub) Mesaj Şablonu
const HubMessageSchema = new mongoose.Schema({
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: true
  },
  user: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HubMessage', HubMessageSchema);