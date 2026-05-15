const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

// --- 1. YENİ İLAN OLUŞTURMA ---
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

// --- 2. TÜM İLANLARI GETİRME ---
router.get('/all', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "İlanlar getirilemedi.", error: err.message });
  }
});

// --- 3. YENİ: BELİRLİ BİR KULLANICININ İLANLARINI GETİRME (PROFİL İÇİN) ---
router.get('/user/:userId', async (req, res) => {
  try {
    const userPosts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(userPosts);
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı ilanları getirilemedi.", error: err.message });
  }
});

module.exports = router;