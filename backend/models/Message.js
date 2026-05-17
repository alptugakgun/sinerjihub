const mongoose = require('mongoose');

// SinerjiHub Mesaj Şablonu (Hem DM hem de Kabile mesajları için ortak yapı)
const MessageSchema = new mongoose.Schema({
  hubId: { 
    type: String, 
    required: false 
  },
  user: { 
    type: String, 
    required: false 
  },
  username: { 
    type: String, 
    required: false 
  },
  senderId: { 
    type: String, 
    required: false 
  },
  receiverId: { 
    type: String, 
    required: false 
  },
  // İçerik artık zorunlu değil, çünkü kullanıcı sadece fotoğraf da atabilir
  content: { 
    type: String, 
    required: false 
  }, 
  // --- KABİLE ARŞİVİ (DOSYA PAYLAŞIMI) ALANLARI ---
  attachment: { 
    type: String, 
    required: false 
  }, 
  attachmentName: { 
    type: String, 
    required: false 
  }, 
  attachmentType: { 
    type: String, 
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Message', MessageSchema);