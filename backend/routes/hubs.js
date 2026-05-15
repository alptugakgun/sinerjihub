const express = require('express');
const router = express.Router();
const Hub = require('../models/Hub');
const User = require('../models/User');

// 1. TÜM KABİLELERİ GETİR (Eğer veritabanı boşsa varsayılan kabileleri oluşturur)
router.get('/all', async (req, res) => {
  try {
    let hubs = await Hub.find();
    
    // Eğer hiç kabile yoksa, başlangıç kabilelerini biz oluşturalım
    if (hubs.length === 0) {
      const defaultHubs = [
        { name: "YBS Geliştiricileri", category: "Yazılım & Yönetim", icon: "💻", description: "Yönetim Bilişim Sistemleri dünyasına dair her şey." },
        { name: "Organik Kimya Lab", category: "Eğitim", icon: "🧪", description: "Reaksiyon mekanizmaları ve karbon dünyası." },
        { name: "GTA 5 RP Sunucusu", category: "Oyun", icon: "🎮", description: "En kaliteli rol yapma deneyimi." },
        { name: "Next.js & React", category: "Yazılım", icon: "⚛️", description: "Modern web teknolojileri topluluğu." }
      ];
      await Hub.insertMany(defaultHubs);
      hubs = await Hub.find();
    }
    
    res.status(200).json(hubs);
  } catch (err) {
    res.status(500).json({ message: "Kabileler getirilemedi.", error: err.message });
  }
});

// 2. KABİLEYE KATIL
router.post('/join', async (req, res) => {
  try {
    const { userId, hubId } = req.body;
    
    const hub = await Hub.findById(hubId);
    const user = await User.findById(userId);
    
    if (!hub || !user) return res.status(404).json({ message: "Kullanıcı veya Kabile bulunamadı." });

    // Zaten üye mi?
    if (hub.members.includes(userId)) {
      return res.status(400).json({ message: "Bu kabileye zaten üyesin dostum!" });
    }

    // Karşılıklı kayıt: Kabileyi kullanıcıya, kullanıcıyı kabileye ekle
    hub.members.push(userId);
    user.hubs.push(hubId);
    
    await hub.save();
    await user.save();

    res.status(200).json({ message: "Kabileye başarıyla kabul edildin!", hub });
  } catch (err) {
    res.status(500).json({ message: "Kabileye katılım başarısız.", error: err.message });
  }
});

module.exports = router;