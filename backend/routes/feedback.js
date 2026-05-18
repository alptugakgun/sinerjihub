const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// --- 1. KULLANICI GERİ BİLDİRİM GÖNDERME (Profil sayfasından tetiklenecek) ---
router.post('/submit', async (req, res) => {
  try {
    const { userId, username, content, type } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({ message: "İçerik ve tür alanları boş bırakılamaz." });
    }

    const newFeedback = new Feedback({
      userId,
      username,
      content,
      type
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json({ message: "Geri bildirim başarıyla sisteme ulaştı!", feedback: savedFeedback });
  } catch (err) {
    res.status(500).json({ message: "Geri bildirim gönderilirken bir hata oluştu.", error: err.message });
  }
});

// --- ADMİN DOĞRULAMA ARA YAZILIMI (Sadece admin paneli için) ---
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Yetkisiz erişim! Admin anahtarı geçersiz." });
  }
  next();
};

// --- 2. TÜM GERİ BİLDİRİMLERİ GETİRME (Sadece Admin Paneli İçin) ---
router.get('/all', adminAuth, async (req, res) => {
  try {
    // En yeniler en üstte olacak şekilde getir
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Geri bildirimler çekilemedi.", error: err.message });
  }
});

// --- 3. GERİ BİLDİRİM DURUMUNU GÜNCELLEME (Beklemede -> İncelendi -> Tamamlandı) ---
router.put('/update-status/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const feedbackId = req.params.id;

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { $set: { status: status } },
      { new: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({ message: "Geri bildirim bulunamadı." });
    }

    res.status(200).json({ message: "Durum güncellendi!", feedback: updatedFeedback });
  } catch (err) {
    res.status(500).json({ message: "Durum güncellenirken hata oluştu.", error: err.message });
  }
});

module.exports = router;