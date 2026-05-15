const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// 1. KULLANICININ TÜM BİLDİRİMLERİNİ GETİR
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.params.userId })
      .sort({ createdAt: -1 }) // En yeni en üstte
      .populate('sender', 'username'); // Gönderenin adını da çekiyoruz
      
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Bildirimler getirilemedi.", error: err.message });
  }
});

// 2. BİLDİRİMLERİ "OKUNDU" OLARAK İŞARETLE
router.put('/mark-read/:userId', async (req, res) => {
  try {
    // Kullanıcıya ait tüm okunmamış bildirimleri okundu yap
    await Notification.updateMany(
      { recipient: req.params.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Tüm bildirimler okundu." });
  } catch (err) {
    res.status(500).json({ message: "İşlem başarısız.", error: err.message });
  }
});

module.exports = router;