const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 150
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // SİHİRLİ DOKUNUŞ: MongoDB bu veriyi tam 24 saat (86400 saniye) sonra otomatik imha edecek!
  }
});

module.exports = mongoose.model('Story', storySchema);