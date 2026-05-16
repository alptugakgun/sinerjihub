const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Modülleri çağırıyoruz (Veritabanı Şablonları)
const User = require('../models/User');
// Not: Hub ve Message modellerinin backend/models klasöründe var olduğunu varsayıyoruz.
const Hub = require('../models/Hub'); 
const Message = require('../models/Message'); 

// --- 1. YENİ KABİLE (HUB) OLUŞTURMA (Tanrı Modu / Admin İçin) ---
router.post('/create', async (req, res) => {
  try {
    const { name, category, description, icon } = req.body;
    
    // Gelen verilerle yepyeni bir kabile inşa et
    const newHub = new Hub({
      name,
      category,
      description,
      icon,
      members: [] // Başlangıçta oda boş
    });
    
    const savedHub = await newHub.save();
    res.status(201).json(savedHub);
  } catch (err) {
    res.status(500).json({ message: "Kabile oluşturulurken evrende bir hata oluştu.", error: err.message });
  }
});

// --- 2. TÜM KABİLELERİ GETİR (Dashboard Keşif Bölümü İçin) ---
router.get('/all', async (req, res) => {
  try {
    // Kabileleri getirirken üyelerin detaylarını da (isim, profil fotosu, karma) iliştir
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

// --- 4. KABİLEYE KATILMA (Join) ---
router.post('/join', async (req, res) => {
  try {
    const { userId, hubId } = req.body;
    
    const hub = await Hub.findById(hubId);
    const user = await User.findById(userId);

    if (!hub || !user) {
      return res.status(404).json({ message: "Kullanıcı veya Kabile bulunamadı." });
    }

    // Kullanıcı zaten üye değilse kabileye ekle
    if (!hub.members.includes(userId)) {
      hub.members.push(userId);
      await hub.save();
    }
    
    // Kabileyi de kullanıcının profiline ekle
    if (!user.hubs.includes(hubId)) {
      user.hubs.push(hubId);
      // Kabileye katılma ödülü olarak 10 Karma Puanı veriyoruz!
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
    // Belirli bir hubId'ye sahip tüm mesajları eskinden yeniye sırala
    const messages = await Message.find({ hubId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Kabile mesajları okunamadı.", error: err.message });
  }
});

// --- 6. KABİLE (ODA) İÇİNE MESAJ GÖNDER (KALICI HAFIZA) ---
router.post('/:id/messages/create', async (req, res) => {
  try {
    const { userId, content } = req.body;
    
    // Mesajı kimin attığını bulmak için kullanıcıyı çek
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Yeni mesaj objesi oluştur (Hem oda ID'si, hem atan kişinin bilgileri)
    const newMessage = new Message({
      hubId: req.params.id,
      user: userId,
      username: user.username,
      content: content
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: "Sinerji mesajı iletilemedi.", error: err.message });
  }
});

module.exports = router;