const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

// 1. YENİ İLAN OLUŞTURMA (POST)
router.post('/create', async (req, res) => {
  try {
    const { userId, content, tags } = req.body;

    // İlanı atan kullanıcının adını bulalım ki ilanda görünsün
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Şablona göre yeni ilan oluştur
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
    // En yeni ilanlar en üstte gelsin diye sort({ createdAt: -1 }) yapıyoruz
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "İlanlar getirilemedi.", error: err.message });
  }
});

module.exports = router;