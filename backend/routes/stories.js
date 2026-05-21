const express = require('routes');
const router = express.Router();
const Story = require('../models/Story');
const User = require('../models/User');

// Tüm aktif sinyalleri çek (24 saati dolmayanlar)
router.get('/active', async (req, res) => {
  try {
    const stories = await Story.find()
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 }); // En yeni en başta
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Yeni sinyal fırlat
router.post('/create', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const newStory = new Story({ user: userId, content });
    const savedStory = await newStory.save();
    
    // Kullanıcı bilgisiyle birlikte dön ki frontend'de hemen avatarı basabilelim
    const populatedStory = await Story.findById(savedStory._id).populate('user', 'username profilePicture');
    res.status(200).json(populatedStory);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;