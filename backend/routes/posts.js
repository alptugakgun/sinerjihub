const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment'); // YENİ: Yorum modelini çağırdık
const { verifyToken } = require('../middleware/verifyToken');

// --- 1. YENİ İLAN (POST) OLUŞTURMA ---
router.post('/create', verifyToken, async (req, res) => {
  try {
    // GÜVENLİK: userId artık body'den değil, doğrulanmış token'dan geliyor.
    // Böylece kimse başka birinin adına ilan oluşturamaz.
    const userId = req.userId;
    const { content, tags } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const newPost = new Post({
      user: userId,
      username: user.username,
      content,
      tags: tags || [],
      upvotes: []
    });
    
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: "İlan oluşturulamadı.", error: err.message });
  }
});

// --- 2. TÜM İLANLARI GETİRME (Dashboard Akışı İçin) ---
router.get('/all', async (req, res) => {
  try {
    // En yeni ilan en üstte gelsin diye -1 ile sıralıyoruz
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "İlanlar getirilemedi.", error: err.message });
  }
});

// --- 3. İLANA DESTEK VERME (UPVOTE) ---
router.post('/upvote/:id', verifyToken, async (req, res) => {
  try {
    // GÜVENLİK: userId artık token'dan geliyor, başkası adına oy kullanılamaz.
    const userId = req.userId;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    // Kullanıcı daha önce beğenmediyse listeye ekle
    if (!post.upvotes.includes(userId)) {
      post.upvotes.push(userId);
      await post.save();
    }
    
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "Beğeni işlemi başarısız oldu.", error: err.message });
  }
});

// --- 4. YENİ: İLANA YORUM (YANKI) EKLEME ---
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    // GÜVENLİK: userId artık token'dan geliyor, başkası adına yorum yazılamaz.
    const userId = req.userId;
    const { content } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Yeni yorumu oluştur ve kaydet
    const newComment = new Comment({
      postId: req.params.id,
      user: userId,
      username: user.username,
      content: content
    });

    const savedComment = await newComment.save();

    // OYUNLAŞTIRMA: Yorum yapan kullanıcıya ekosisteme katkısından dolayı +2 Karma ver!
    user.karmaPoints = (user.karmaPoints || 0) + 2;
    await user.save();

    res.status(201).json(savedComment);
  } catch (err) {
    res.status(500).json({ message: "Yorum eklenirken evrende bir hata oluştu.", error: err.message });
  }
});

// --- 5. YENİ: BİR İLANIN TÜM YORUMLARINI GETİRME ---
router.get('/:id/comments', async (req, res) => {
  try {
    // İlgili ilana ait yorumları bul ve eski yorum en üstte olacak şekilde (1) sırala
    const comments = await Comment.find({ postId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Yorumlar getirilemedi.", error: err.message });
  }
});

module.exports = router;