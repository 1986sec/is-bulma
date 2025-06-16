const jwt = require('jsonwebtoken');
const { AppError } = require('./error.js');
const { User } = require('../models/User.js');
const config = require('../config');
const logger = require('../utils/logger');
const user = require('../utils/user');

module.exports = async (req, res, next) => {
  try {
    // Token'ı al
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new Error('Token bulunamadı');
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, config.jwt.secret);

    // Kullanıcıyı bul
    const user = await user.getUser(decoded.id);

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    if (user.status !== 'active') {
      throw new Error('Hesap aktif değil');
    }

    // 4) Check if user changed password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }

    // Kullanıcıyı request'e ekle
    req.user = user;

    logger.debug('Kullanıcı doğrulandı:', {
      userId: user.id,
    });

    next();
  } catch (error) {
    logger.error('Kimlik doğrulama hatası:', {
      error: error.message,
    });

    res.status(401).json({
      error: {
        message: 'Kimlik doğrulama başarısız',
        status: 401,
      },
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
    }
    next();
  };
}; 