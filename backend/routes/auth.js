const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// --- 1. KULLANICI KAYDI (REGISTER) ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, interests } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta zaten kullanımda dostum." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Bu kullanıcı adı daha önce alınmış." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      interests: interests || []
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ message: "Kayıt olurken bir hata oluştu.", error: err.message });
  }
});

// --- 2. KULLANICI GİRİŞİ (LOGIN) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Hatalı şifre girdin dostum." });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Giriş yapılırken bir hata oluştu.", error: err.message });
  }
});

// --- 3. KULLANICI BİLGİSİ GETİRME ---
router.get('/user/:id', async (req, res) => {
  try {
    // Şifreyi hariç tutarak tüm verileri getir
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı bilgisi alınamadı.", error: err.message });
  }
});

// --- 4. YENİ: PROFİL FOTOĞRAFI GÜNCELLEME ---
router.put('/update-avatar/:id', async (req, res) => {
  try {
    const { profilePicture } = req.body; // Base64 formatındaki fotoğraf verisi
    
    if (!profilePicture) {
      return res.status(400).json({ message: "Fotoğraf verisi boş olamaz." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { profilePicture: profilePicture } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: "Profil fotoğrafı başarıyla güncellendi!", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Fotoğraf yüklenemedi.", error: err.message });
  }
});

module.exports = router;