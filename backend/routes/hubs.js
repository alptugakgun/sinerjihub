const express = require('express');
const router = express.Router();
const Hub = require('../models/Hub');
const User = require('../models/User');
const HubMessage = require('../models/HubMessage'); // YENİ: Mesaj modelini çağırdık

// 1. TÜM KABİLELERİ GETİR (Varsayılanları oluşturma mantığı dahil)
router.get('/all', async (req, res) => {
  try {
    let hubs = await Hub.find();
    
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

    if (hub.members.includes(userId)) {
      return res.status(400).json({ message: "Bu kabileye zaten üyesin dostum!" });
    }

    hub.members.push(userId);
    user.hubs.push(hubId);
    
    await hub.save();
    await user.save();

    res.status(200).json({ message: "Kabileye başarıyla kabul edildin!", hub });
  } catch (err) {
    res.status(500).json({ message: "Kabileye katılım başarısız.", error: err.message });
  }
});

// 3. YENİ: TEK BİR KABİLENİN DETAYLARINI GETİR
router.get('/:id', async (req, res) => {
  try {
    // Kabile bilgisini alırken, üyelerin isimlerini ve karma puanlarını da yanına ekle (.populate)
    const hub = await Hub.findById(req.params.id).populate('members', 'username karmaPoints');
    if (!hub) return res.status(404).json({ message: "Kabile bulunamadı." });
    
    res.status(200).json(hub);
  } catch (err) {
    res.status(500).json({ message: "Kabile bilgisi getirilemedi.", error: err.message });
  }
});

// 4. YENİ: KABİLENİN SOHBET MESAJLARINI GETİR
router.get('/:id/messages', async (req, res) => {
  try {
    // Eskiden yeniye doğru sırala (1)
    const messages = await HubMessage.find({ hub: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Mesajlar getirilemedi.", error: err.message });
  }
});

// 5. YENİ: KABİLE ODASINA MESAJ GÖNDER
router.post('/:id/messages/create', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const hubId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const newMessage = new HubMessage({
      hub: hubId,
      user: userId,
      username: user.username,
      content
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: "Mesaj gönderilemedi.", error: err.message });
  }
});

module.exports = router;