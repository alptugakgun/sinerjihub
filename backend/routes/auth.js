const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Az önce yaptığımız şablonu çağırıyoruz

// KAYIT OL (REGISTER) ROTASI
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. E-posta sistemde zaten var mı diye kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta kabilede zaten kullanımda dostum!" });
    }

    // 2. Şifreyi şifrele (Hash işlemi)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Yeni kullanıcıyı şablona göre oluştur
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    // 4. Veritabanına (MongoDB) kaydet
    const savedUser = await newUser.save();
    res.status(201).json({ message: "SinerjiHub'a hoş geldin!", userId: savedUser._id });

  } catch (err) {
    res.status(500).json({ message: "Sunucuda bir arıza çıktı.", error: err.message });
  }
});

module.exports = router;