const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Hub = require('../models/Hub'); 
const Message = require('../models/Message'); 
const { verifyToken } = require('../middleware/verifyToken');

// 1. KULLANICI / ADMIN TARAFINDAN KABİLE OLUŞTURMA
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { name, category, description, icon, isPrivate, passcode } = req.body;
    // GÜVENLİK: creatorId artık token'dan geliyor, başkası adına kabile açılamaz.
    const creatorId = req.userId;
    
    const user = await User.findById(creatorId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    if (user.karmaPoints < 50) return res.status(403).json({ message: "Özel kabile kurmak için en az 50 Sinerji Puanına (Ağ Gezgini) ulaşmalısın!" });

    const newHub = new Hub({
      name, category, description, icon, 
      isPrivate: isPrivate || false, 
      passcode: passcode || "", 
      creator: creatorId || null,
      members: creatorId ? [creatorId] : [] 
    });
    
    const savedHub = await newHub.save();
    
    if (creatorId) {
       await User.findByIdAndUpdate(creatorId, { $push: { hubs: savedHub._id } });
    }

    res.status(201).json(savedHub);
  } catch (err) {
    res.status(500).json({ message: "Kabile oluşturulurken evrende bir hata oluştu.", error: err.message });
  }
});

// 2. TÜM KABİLELERİ GETİR 
router.get('/all', async (req, res) => {
  try {
    const hubs = await Hub.find().populate('members', 'username profilePicture karmaPoints');
    res.status(200).json(hubs);
  } catch (err) {
    res.status(500).json({ message: "Kabileler getirilemedi.", error: err.message });
  }
});

// 3. TEK BİR KABİLE DETAYI 
router.get('/:id', async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id).populate('members', 'username profilePicture karmaPoints');
    if (!hub) return res.status(404).json({ message: "Bu kabile bulunamadı veya silinmiş." });
    res.status(200).json(hub);
  } catch (err) {
    res.status(500).json({ message: "Kabile detayı alınamadı.", error: err.message });
  }
});

// 4. KABİLEYE KATILMA
router.post('/join', verifyToken, async (req, res) => {
  try {
    // GÜVENLİK: userId artık token'dan geliyor, başkası adına kabileye katılınamaz.
    const userId = req.userId;
    const { hubId, enteredPasscode } = req.body;
    
    const hub = await Hub.findById(hubId);
    const user = await User.findById(userId);

    if (!hub || !user) return res.status(404).json({ message: "Kullanıcı veya Kabile bulunamadı." });
    if (hub.isPrivate && hub.passcode !== enteredPasscode) return res.status(401).json({ message: "Hatalı şifre! Bu özel kabileye giriş iznin yok." });

    if (!hub.members.includes(userId)) {
      hub.members.push(userId);
      await hub.save();
    }
    
    if (!user.hubs.includes(hubId)) {
      user.hubs.push(hubId);
      user.karmaPoints = (user.karmaPoints || 0) + 10;
      await user.save();
    }

    res.status(200).json({ message: "Kabileye başarıyla katıldın, sinerjin bol olsun!" });
  } catch (err) {
    res.status(500).json({ message: "Kabileye katılırken hata oluştu.", error: err.message });
  }
});

// 5. KABİLE İÇİ MESAJLARI GETİR 
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await Message.find({ hubId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Kabile mesajları okunamadı.", error: err.message });
  }
});

// 6. KABİLE İÇİNE DOSYA VEYA MESAJ GÖNDER 
router.post('/:id/messages/create', verifyToken, async (req, res) => {
  try {
    // GÜVENLİK: userId artık token'dan geliyor, başkası adına mesaj gönderilemez.
    const userId = req.userId;
    const { content, attachment, attachmentName, attachmentType } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const newMessage = new Message({
      hubId: req.params.id,
      user: userId,
      username: user.username,
      content: content || "",
      attachment: attachment || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: "Sinerji mesajı iletilemedi.", error: err.message });
  }
});

// --- 7. YENİ: KOD LABORATUVARI ARŞİVİNE KOD KAYDET (SAVE SNIPPET) ---
router.post('/:id/code/save', verifyToken, async (req, res) => {
  try {
    // GÜVENLİK: userId artık token'dan geliyor, başkası adına kod kaydedilemez.
    const userId = req.userId;
    const { code, title } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Kabile bulunamadı." });

    const newSnippet = {
      authorId: user._id,
      authorName: user.username,
      code: code,
      title: title || "Sinerji Kod Bloğu",
      savedAt: Date.now()
    };

    hub.codeSnippets.push(newSnippet);
    await hub.save();

    res.status(201).json({ message: "Kod bloğu başarıyla arşive eklendi!", snippet: newSnippet });
  } catch (err) {
    res.status(500).json({ message: "Kod kaydedilirken bir hata oluştu.", error: err.message });
  }
});

module.exports = router;