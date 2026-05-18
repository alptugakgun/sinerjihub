const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- ADMİN DOĞRULAMA ARA YAZILIMI (MIDDLEWARE) ---
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword) {
    return res.status(401).json({ message: "Erişim engellendi. Admin anahtarı eksik!" });
  }

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Yetkisiz erişim! Geçersiz kontrol anahtarı." });
  }

  next();
};

// --- 1. ADMİN ŞİFRESİ DOĞRULAMA ---
router.post('/verify', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ success: true, message: "Tanrı Modu Aktif!" });
  } else {
    return res.status(401).json({ success: false, message: "Hatalı şifre!" });
  }
});

// --- 2. E-POSTA İLE KULLANICI ARAMA MOTORU ---
router.post('/search-user', adminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "Gezgin bulunamadı." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Sistem dalgalanması.", error: err.message });
  }
});

// --- 3. RÜTBE (TAG) VE PUAN DÜZENLEME MOTORU ---
router.put('/update-user/:id', adminAuth, async (req, res) => {
  try {
    const { roles, karmaPoints } = req.body;
    const userId = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { roles: roles, karmaPoints: karmaPoints } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "Kullanıcı yok." });
    }

    res.status(200).json({ message: "Ekosistem şekillendi!", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Hata meydana geldi.", error: err.message });
  }
});

module.exports = router;