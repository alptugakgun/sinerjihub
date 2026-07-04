// TEK SEFERLİK SCRIPT: Veritabanındaki mevcut private hub'ların düz metin
// passcode'larını bcrypt hash'e çevirir. Bir kere çalıştırıp SİLİNEBİLİR.
//
// Çalıştırma: backend klasöründe -> node scripts/migratePasscodes.js
// (Aynı .env dosyasının (MONGODB_URI) mevcut klasörde olduğundan emin ol.)

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hub = require('../models/Hub');

// bcrypt hash'leri hep bu önekle başlar; zaten hash'lenmiş kayıtları tekrar hash'lememek için kontrol
const isAlreadyHashed = (value) => /^\$2[aby]\$/.test(value || "");

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB bağlantısı kuruldu, geçiş başlıyor...');

  const hubs = await Hub.find({ isPrivate: true });
  let migrated = 0;
  let skipped = 0;

  for (const hub of hubs) {
    if (!hub.passcode || isAlreadyHashed(hub.passcode)) {
      skipped++;
      continue;
    }
    const salt = await bcrypt.genSalt(10);
    hub.passcode = await bcrypt.hash(hub.passcode, salt);
    await hub.save();
    migrated++;
    console.log(`  -> "${hub.name}" kabilesinin şifresi hash'lendi.`);
  }

  console.log(`\n🎉 Tamamlandı: ${migrated} kabile hash'lendi, ${skipped} kabile zaten hash'liydi/boştu.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Geçiş sırasında hata:', err);
  process.exit(1);
});
