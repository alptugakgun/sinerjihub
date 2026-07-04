const jwt = require('jsonwebtoken');

// --- KİMLİK DOĞRULAMA KALKANI ---
// Bu middleware, isteği atan kişinin gerçekten kim olduğunu (JWT üzerinden) doğrular.
// Doğrulanan kullanıcı bilgisi req.userId ve req.userRoles içine yazılır;
// route'lar artık body/params'tan gelen id'ye değil, BUNA güvenmelidir.
function verifyToken(req, res, next) {
  // Token'ı önce httpOnly cookie'den, yoksa Authorization header'dan al
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: "Giriş yapmadan bu işlemi gerçekleştiremezsin." });
  }

  // DİKKAT: Artık fallback secret YOK. .env eksikse sunucu zaten ayağa kalkmamalı (server.js'de kontrol ediyoruz).
  const tokenSecret = process.env.JWT_SECRET;

  jwt.verify(token, tokenSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Oturumun geçersiz veya süresi dolmuş, tekrar giriş yap." });
    }
    req.userId = decoded.id;
    req.userRoles = decoded.roles || [];
    next();
  });
}

// --- "SADECE KENDİ HESABIN" KONTROLÜ ---
// route parametresindeki :id (veya body.userId), token sahibinin kendi id'siyle eşleşmiyorsa reddeder.
// Admin rolündeki kullanıcılara (örn. "Kurucu") istisna tanımak istersen roles kontrolünü burada genişletebilirsin.
function requireSelf(paramName = 'id') {
  return (req, res, next) => {
    const targetId = req.params[paramName] || req.body.userId;
    if (String(req.userId) !== String(targetId)) {
      return res.status(403).json({ message: "Bu işlemi sadece kendi hesabın için yapabilirsin." });
    }
    next();
  };
}

module.exports = { verifyToken, requireSelf };
