const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');

// 1. İKİ KULLANICI ARASINDAKİ SOHBET GEÇMİŞİNİ GETİR
router.get('/between/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    // Ya 1 gönderdi 2 aldı, ya da 2 gönderdi 1 aldı (tüm geçmiş)
    const messages = await DirectMessage.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ]
    }).sort({ createdAt: 1 }); // Eskiden yeniye sırala

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Mesajlar getirilemedi.", error: err.message });
  }
});

// 2. YENİ BİREBİR MESAJ GÖNDER
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const newMessage = new DirectMessage({
      sender: senderId,
      receiver: receiverId,
      content
    });

    const savedMessage = await newMessage.save();
    
    // Not: Normalde burada Socket.io gibi bir teknoloji ile anlık bildirim atılır,
    // ama bizim mevcut yapımızda alıcı sayfayı yenileyince (veya odaya girince) mesajı görecek.
    
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: "Mesaj gönderilemedi.", error: err.message });
  }
});

// 3. KULLANICININ KONUŞTUĞU KİŞİLERİ LİSTELE (Gelen Kutusu İçin)
router.get('/inbox/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kullanıcının attığı veya aldığı tüm mesajları bul
    const messages = await DirectMessage.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).populate('sender', 'username').populate('receiver', 'username');

    // Benzersiz konuştuğu kişileri ayıkla (Aynı kişiyle 100 mesaj varsa 1 kere listele)
    const contacts = new Map();
    
    messages.forEach(msg => {
      // Eğer mesajı ben gönderdiysem karşı taraf receiver'dır
      if (msg.sender._id.toString() === userId) {
        contacts.set(msg.receiver._id.toString(), msg.receiver);
      } else {
        // Eğer mesaj bana geldiyse karşı taraf sender'dır
        contacts.set(msg.sender._id.toString(), msg.sender);
      }
    });

    // Map objesini array'e çevirip frontend'e yolla
    res.status(200).json(Array.from(contacts.values()));
  } catch (err) {
    res.status(500).json({ message: "Gelen kutusu yüklenemedi.", error: err.message });
  }
});

module.exports = router;