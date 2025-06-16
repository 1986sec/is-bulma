// Route index dosyası (isteğe bağlı, import kolaylığı için)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const config = require('../config');

// Hız sınırı
const limiter = rateLimit(config.security.rateLimit);

// Auth rotaları
router.use('/auth', limiter, require('./auth'));

// Kullanıcı rotaları
router.use('/users', auth, require('./user'));

// Şirket rotaları
router.use('/companies', auth, require('./company'));

// İş ilanı rotaları
router.use('/jobs', auth, require('./job'));

// Başvuru rotaları
router.use('/applications', auth, require('./application'));

// Mesaj rotaları
router.use('/messages', auth, require('./message'));

// Bildirim rotaları
router.use('/notifications', auth, require('./notification'));

// Dosya rotaları
router.use('/files', auth, require('./file'));

// Arama rotaları
router.use('/search', auth, require('./search'));

// İstatistik rotaları
router.use('/stats', auth, require('./stats'));

// Ödeme rotaları
router.use('/payments', auth, require('./payment'));

// 404 hatası
router.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Sayfa bulunamadı',
      status: 404,
    },
  });
});

module.exports = router; 