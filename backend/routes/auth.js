const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// --- KAYIT OL (REGISTER) ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Bu e-posta kabilede zaten kullanımda!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    const savedUser = await newUser.save();
    res.status(201).json({ message: "Hoş geldin!", userId: savedUser._id });
  } catch (err) {
    res.status(500).json({ message: "Sunucu hatası.", error: err.message });
  }
});

// --- GİRİŞ YAP (LOGIN) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre yanlış." });

    res.status(200).json({ message: "Giriş başarılı", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Sunucu hatası.", error: err.message });
  }
});

// --- PROFİL GÜNCELLE (ONBOARDING VERİLERİ) ---
router.put('/update-profile', async (req, res) => {
  try {
    const { userId, roles, interests } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { roles, interests }, 
      { new: true }
    );
    res.status(200).json({ message: "Profil başarıyla güncellendi!", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Profil güncellenirken hata oluştu.", error: err.message });
  }
});

// --- YENİ: KULLANICI BİLGİLERİNİ GETİR (DASHBOARD İÇİN) ---
router.get('/user/:id', async (req, res) => {
  try {
    // Güvenlik: .select('-password') diyerek şifreyi frontend'e asla göndermiyoruz
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı bilgileri alınırken hata.", error: err.message });
  }
});

module.exports = router;