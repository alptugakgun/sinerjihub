const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

    // GÜVENLİK: passcode artık düz metin değil, hash'lenmiş olarak saklanıyor.
    let hashedPasscode = "";
    if (isPrivate && passcode) {
      const salt = await bcrypt.genSalt(10);
      hashedPasscode = await bcrypt.hash(passcode, salt);
    }

    const newHub = new Hub({
      name, category, description, icon, 
      isPrivate: isPrivate || false, 
      passcode: hashedPasscode, 
      creator: creatorId || null,
      members: creatorId ? [creatorId] : [] 
    });
    
    const savedHub = await newHub.save();
    
    if (creatorId) {
       await User.findByIdAndUpdate(creatorId, { $push: { hubs: savedHub._id } });
    }

    // GÜVENLİK: response'a passcode (hash olsa bile) hiç dahil edilmesin.
    const hubToReturn = savedHub.toObject();
    delete hubToReturn.passcode;

    res.status(201).json(hubToReturn);
  } catch (err) {
    res.status(500).json({ message: "Kabile oluşturulurken evrende bir hata oluştu.", error: err.message });
  }
});

// 2. TÜM KABİLELERİ GETİR 
router.get('/all', async (req, res) => {
  try {
    const hubs = await Hub.find().select('-passcode').populate('members', 'username profilePicture karmaPoints');
    
    // GÜVENLİK: Özel kabilelerin üyelerini gizle
    const secureHubs = hubs.map(hub => {
      const hubObj = hub.toObject();
      if (hubObj.isPrivate) {
        hubObj.memberCount = hubObj.members.length;
        hubObj.members = []; // Üyeleri gizle
      }
      return hubObj;
    });

    res.status(200).json(secureHubs);
  } catch (err) {
    res.status(500).json({ message: "Kabileler getirilemedi.", error: err.message });
  }
});

// 3. TEK BİR KABİLE DETAYI 
router.get('/:id', async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id).select('-passcode').populate('members', 'username profilePicture karmaPoints');
    if (!hub) return res.status(404).json({ message: "Bu kabile bulunamadı veya silinmiş." });
    
    // GÜVENLİK: Özel kabilelerin üyelerini gizle
    const hubObj = hub.toObject();
    if (hubObj.isPrivate) {
      hubObj.memberCount = hubObj.members.length;
      hubObj.members = []; // Üyeleri gizle
    }

    res.status(200).json(hubObj);
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

    // GÜVENLİK: passcode artık hash'li saklandığı için düz eşitlik değil, bcrypt.compare kullanıyoruz.
    if (hub.isPrivate) {
      const passcodeMatches = await bcrypt.compare(enteredPasscode || "", hub.passcode || "");
      if (!passcodeMatches) {
        return res.status(401).json({ message: "Hatalı şifre! Bu özel kabileye giriş iznin yok." });
      }
    }

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

router.get('/:id/messages', verifyToken, async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Kabile bulunamadı." });

    // GÜVENLİK (IDOR): Özel kabile mesajlarını sadece üyeler görebilir
    // Herkesin gördüğü Public kabilelere de üye kontrolü yapabiliriz ama sadece isPrivate olana yapıyoruz şimdilik
    if (hub.isPrivate && !hub.members.includes(req.userId)) {
      return res.status(403).json({ message: "Bu kabilenin mesajlarını görmek için üye olmalısın." });
    }

    const messages = await Message.find({ hubId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Kabile mesajları okunamadı.", error: err.message });
  }
});

// 6. KABİLE İÇİNE DOSYA VEYA MESAJ GÖNDER 
router.post('/:id/messages/create', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { content, attachment, attachmentName, attachmentType } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Kabile bulunamadı." });

    // GÜVENLİK (Yetkilendirme): Sadece üyeler mesaj gönderebilir
    if (!hub.members.includes(userId)) {
      return res.status(403).json({ message: "Bu kabileye mesaj göndermek için üye olmalısın." });
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

// --- 7. YENİ: KOD LABORATUVARI ARŞİVİNE KOD KAYDET (SAVE SNIPPET) ---
router.post('/:id/code/save', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { code, title } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Kabile bulunamadı." });

    // GÜVENLİK (Yetkilendirme): Sadece üyeler arşive kod ekleyebilir
    if (!hub.members.includes(userId)) {
      return res.status(403).json({ message: "Kabile arşivine kod kaydetmek için üye olmalısın." });
    }

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