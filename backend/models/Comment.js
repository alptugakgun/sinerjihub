const mongoose = require('mongoose');

// SinerjiHub İlan Yorumları (Yankılar) Şablonu
const CommentSchema = new mongoose.Schema({
  // Hangi ilana yapıldı?
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  // Yorumu kim yaptı?
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  // Yorumun içeriği
  content: {
    type: String,
    required: true
  },
  // İleride yorumları da beğenmek istersek diye altyapı
  upvotes: [
    {
      type: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', CommentSchema);