const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Hub = require('../models/Hub'); 
const Message = require('../models/Message'); 

// --- 1. KULLANICI / ADMIN TARAFINDAN KABİLE (HUB) OLUŞTURMA ---
router.post('/create', async (req, res) => {
  try {
    const { name, category, description, icon, isPrivate, passcode, creatorId } = req.body;
    
    // Eğer bir kullanıcı oluşturuyorsa Karma puanını kontrol ediyoruz
    if (creatorId) {
      const user = await User.findById(creatorId);
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı." });
      }
      if (user.karmaPoints < 50) {
        return res.status(403).json({ message: "Özel kabile kurmak için en az 50 Sinerji Puanına (Ağ Gezgini) ulaşmalısın!" });
      }
    }

    const newHub = new Hub({
      name,
      category,
      description,
      icon,
      isPrivate: isPrivate || false,
      passcode: passcode || "",
      creator: creatorId || null,
      members: creatorId ? [creatorId] : [] // Kurucu otomatik olarak odanın ilk üyesidir
    });
    
    const savedHub = await newHub.save();
    
    // Kurucuyu da bu kabileye doğrudan bağlayalım
    if (creatorId) {
       await User.findByIdAndUpdate(creatorId, { $push: { hubs: savedHub._id } });
    }

    res.status(201).json(savedHub);
  } catch (err) {
    res.status(500).json({ message: "Kabile oluşturulurken evrende bir hata oluştu.", error: err.message });
  }
});

// --- 2. TÜM KABİLELERİ GETİR (Dashboard Keşif Bölümü İçin) ---
router.get('/all', async (req, res) => {
  try {
    // Kabileleri getirirken üyelerin detaylarını da (isim, profil fotosu, karma) iliştiriyoruz
    const hubs = await Hub.find().populate('members', 'username profilePicture karmaPoints');
    res.status(200).json(hubs);
  } catch (err) {
    res.status(500).json({ message: "Kabileler getirilemedi.", error: err.message });
  }
});

// --- 3. TEK BİR KABİLE DETAYI (Kabile Odasına Girildiğinde) ---
router.get('/:id', async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id).populate('members', 'username profilePicture karmaPoints');
    if (!hub) {
      return res.status(404).json({ message: "Bu kabile bulunamadı veya silinmiş." });
    }
    res.status(200).json(hub);
  } catch (err) {
    res.status(500).json({ message: "Kabile detayı alınamadı.", error: err.message });
  }
});

// --- 4. KABİLEYE KATILMA (Şifre Kontrollü Giriş) ---
router.post('/join', async (req, res) => {
  try {
    const { userId, hubId, enteredPasscode } = req.body;
    
    const hub = await Hub.findById(hubId);
    const user = await User.findById(userId);

    if (!hub || !user) {
      return res.status(404).json({ message: "Kullanıcı veya Kabile bulunamadı." });
    }

    // Eğer oda gizliyse ve dışarıdan girilen şifre uyuşmuyorsa içeri alma
    if (hub.isPrivate && hub.passcode !== enteredPasscode) {
      return res.status(401).json({ message: "Hatalı şifre! Bu özel kabileye giriş iznin yok." });
    }

    // Kullanıcı zaten üye değilse kabileye ekle
    if (!hub.members.includes(userId)) {
      hub.members.push(userId);
      await hub.save();
    }
    
    // Kabileyi kullanıcının kendi hub listesine de ekle
    if (!user.hubs.includes(hubId)) {
      user.hubs.push(hubId);
      // Kabileye katılma ödülü olarak 10 Karma Puanı
      user.karmaPoints = (user.karmaPoints || 0) + 10;
      await user.save();
    }

    res.status(200).json({ message: "Kabileye başarıyla katıldın, sinerjin bol olsun!" });
  } catch (err) {
    res.status(500).json({ message: "Kabileye katılırken hata oluştu.", error: err.message });
  }
});

// --- 5. KABİLE (ODA) İÇİ MESAJLARI GETİR ---
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await Message.find({ hubId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Kabile mesajları okunamadı.", error: err.message });
  }
});

// --- 6. KABİLE (ODA) İÇİNE DOSYA VEYA MESAJ GÖNDER (KALICI HAFIZA) ---
router.post('/:id/messages/create', async (req, res) => {
  try {
    // Eklenen yeni dosya parametrelerini body'den alıyoruz
    const { userId, content, attachment, attachmentName, attachmentType } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

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

module.exports = router;