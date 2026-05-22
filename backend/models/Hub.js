const mongoose = require('mongoose');

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
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  isPrivate: {
    type: Boolean,
    default: false
  },
  passcode: {
    type: String,
    default: ""
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String },
      content: { type: String },
      attachment: { type: String }, 
      attachmentName: { type: String },
      attachmentType: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  
  // --- YENİ EKLENEN: KOD LABORATUVARI ARŞİVİ (LIVE IDE SNIPPETS) ---
  codeSnippets: [
    {
      authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      authorName: { type: String },
      code: { type: String, required: true },
      title: { type: String, default: "Sinerji Kod Bloğu" },
      savedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hub', HubSchema);