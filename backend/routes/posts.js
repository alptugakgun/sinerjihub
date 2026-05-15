const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification'); // YENİ: Bildirim modeli dahil edildi

// 1. YENİ İLAN OLUŞTURMA (POST)
router.post('/create', async (req, res) => {
  try {
    const { userId, content, tags } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const newPost = new Post({
      user: userId,
      username: user.username || "Gezgin",
      content,
      tags
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: "İlan oluşturulamadı.", error: err.message });
  }
});

// 2. TÜM İLANLARI GETİRME (GET)
router.get('/all', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "İlanlar getirilemedi.", error: err.message });
  }
});

// 3. BELİRLİ BİR KULLANICININ İLANLARINI GETİRME (GET)
router.get('/user/:userId', async (req, res) => {
  try {
    const userPosts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(userPosts);
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı ilanları getirilemedi.", error: err.message });
  }
});

// 4. İLANI DESTEKLE (UPVOTE), KARMA KAZANDIR VE BİLDİRİM GÖNDER (POST)
router.post('/upvote/:postId', async (req, res) => {
  try {
    const { userId } = req.body; // Butona basan kişinin ID'si
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "İlan bulunamadı." });

    // Kullanıcı kendi ilanını destekleyemez
    if (post.user.toString() === userId) {
      return res.status(400).json({ message: "Kendi ilanını destekleyemezsin dostum!" });
    }

    // Kullanıcı zaten desteklemiş mi?
    if (post.upvotes.includes(userId)) {
      return res.status(400).json({ message: "Bu ilanı zaten destekledin." });
    }

    // 1. İlanın upvotes dizisine kullanıcıyı ekle
    post.upvotes.push(userId);
    await post.save();

    // 2. İlan sahibinin Karma puanını artır (+5 Karma)
    await User.findByIdAndUpdate(post.user, { $inc: { karmaPoints: 5 } });

    // 3. YENİ: İLAN SAHİBİNE BİLDİRİM GÖNDER
    const senderUser = await User.findById(userId); // Destekleyen kişiyi bul
    const newNotification = new Notification({
      recipient: post.user, // İlan sahibi (Bildirimi alacak kişi)
      sender: userId, // Destekleyen (Bildirimi tetikleyen kişi)
      type: "upvote",
      message: `${senderUser.username} kabile çağrını destekledi. Sana +5 Karma kazandırdı! 🌟`
    });
    await newNotification.save();

    res.status(200).json({ message: "Desteklendi! +5 Karma ilan sahibine gitti ve bildirim gönderildi.", post });
  } catch (err) {
    res.status(500).json({ message: "İşlem başarısız.", error: err.message });
  }
});

module.exports = router;