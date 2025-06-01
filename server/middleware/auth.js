const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ mesaj: 'Token gerekli' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ mesaj: 'Geçersiz token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.rol !== 'admin') return res.status(403).json({ mesaj: 'Yetkisiz' });
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware }; 