const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

// 1. YENİ İLAN OLUŞTURMA
router.post('/create', async (req, res) => {
  try {
    const { userId, content, tags } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

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

// 2. TÜM İLANLARI GETİRME
router.get('/all', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "İlanlar getirilemedi.", error: err.message });
  }
});

// 3. KULLANICI İLANLARINI GETİRME
router.get('/user/:userId', async (req, res) => {
  try {
    const userPosts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(userPosts);
  } catch (err) {
    res.status(500).json({ message: "İlanlar getirilemedi.", error: err.message });
  }
});

// 4. YENİ: İLANI DESTEKLE (UPVOTE) VE KARMA KAZANDIR
router.post('/upvote/:postId', async (req, res) => {
  try {
    const { userId } = req.body; // Butona basan kişinin ID'si
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "İlan bulunamadı." });

    // Kullanıcı kendi ilanını destekleyemez (Etik kural!)
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

    res.status(200).json({ message: "Desteklendi! +5 Karma ilan sahibine gitti.", post });
  } catch (err) {
    res.status(500).json({ message: "İşlem başarısız.", error: err.message });
  }
});

module.exports = router;