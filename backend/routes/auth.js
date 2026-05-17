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

    // GROWTH HACKING: Sistemdeki mevcut toplam kullanıcı sayısını bul
    const userCount = await User.countDocuments();
    
    // ZEKİ ALGORİTMA: İlk 1000 kişiye 50 Karma (Ağ Gezgini) ver, 1001. kişi 0'dan başlasın
    const startingKarma = userCount < 1000 ? 50 : 0;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      interests: interests || [],
      karmaPoints: startingKarma, // İlk 1000 kişi jesti buraya eklendi!
      hubs: [],
      friends: []
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
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı bilgisi alınamadı.", error: err.message });
  }
});

// --- 4. PROFİL FOTOĞRAFI GÜNCELLEME ---
router.put('/update-avatar/:id', async (req, res) => {
  try {
    const { profilePicture } = req.body; 
    
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

// --- 5. SİNERJİ RADARI (YAPAY ZEKA / EŞLEŞTİRME ALGORİTMASI) ---
router.get('/recommendations/:id', async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    // Kullanıcının ilgi alanlarına (interests) sahip olan, 
    // ama kendisi olmayan ve halihazırda arkadaşı OLMAYAN kişileri bul
    const recommendedUsers = await User.find({
      _id: { $ne: currentUser._id, $nin: currentUser.friends },
      interests: { $in: currentUser.interests }
    })
    .limit(4) // Sadece en uygun 4 kişiyi öner
    .select('username profilePicture karmaPoints interests');

    res.status(200).json(recommendedUsers);
  } catch (err) {
    res.status(500).json({ message: "Sinerji radarı çalıştırılamadı.", error: err.message });
  }
});

module.exports = router;