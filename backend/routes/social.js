const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');

// --- 1. ARKADAŞLIK İSTEĞİ GÖNDER ---
router.post('/request/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    // Kendine istek atma engeli
    if (senderId === receiverId) {
      return res.status(400).json({ message: "Kendine arkadaşlık isteği gönderemezsin dostum!" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Zaten arkadaş mı?
    if (receiver.friends.includes(senderId)) {
      return res.status(400).json({ message: "Bu kullanıcıyla zaten arkadaşsın." });
    }

    // Zaten bekleyen bir istek var mı?
    if (receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "Zaten bekleyen bir arkadaşlık isteğin var." });
    }

    // Karşılıklı listeleri güncelle
    receiver.friendRequests.push(senderId);
    sender.sentRequests.push(receiverId);

    await receiver.save();
    await sender.save();

    // BİLDİRİM GÖNDER (Notification Motoruna Entegre)
    const newNotification = new Notification({
      recipient: receiverId,
      sender: senderId,
      type: "friend_request",
      message: `${sender.username} sana bir arkadaşlık isteği gönderdi! 👋`
    });
    await newNotification.save();

    res.status(200).json({ message: "İstek başarıyla iletildi." });
  } catch (err) {
    res.status(500).json({ message: "Arkadaşlık isteği gönderilirken hata oluştu.", error: err.message });
  }
});

// --- 2. GELEN İSTEKLERİ LİSTELE ---
router.get('/requests/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friendRequests', 'username karmaPoints');
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    res.status(200).json(user.friendRequests);
  } catch (err) {
    res.status(500).json({ message: "İstekler getirilemedi.", error: err.message });
  }
});

// --- 3. ARKADAŞLIK İSTEĞİNİ KABUL ET ---
router.post('/accept/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // İstek listelerinden temizle
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== userId);

    // Karşılıklı arkadaş listesine ekle
    user.friends.push(friendId);
    friend.friends.push(userId);

    await user.save();
    await friend.save();

    // BİLDİRİM GÖNDER (Kabul eden kişiden karşı tarafa)
    const acceptNotification = new Notification({
      recipient: friendId,
      sender: userId,
      type: "friend_accept",
      message: `${user.username} arkadaşlık isteğini kabul etti! Artık direkt mesajlaşabilirsiniz. ✨`
    });
    await acceptNotification.save();

    res.status(200).json({ message: "Artık arkadaşsınız!", user });
  } catch (err) {
    res.status(500).json({ message: "İstek kabul edilirken hata oluştu.", error: err.message });
  }
});

// --- 4. ARKADAŞLIK İSTEĞİNİ REDDET ---
router.post('/reject/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    // Listelerden sessizce temizle
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Arkadaşlık isteği reddedildi." });
  } catch (err) {
    res.status(500).json({ message: "İşlem başarısız.", error: err.message });
  }
});

module.exports = router;