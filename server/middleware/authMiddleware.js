const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError, handleJWTError, handleJWTExpiredError } = require('./errorMiddleware');
const logger = require('../utils/logger');

// Token doğrulama
const protect = async (req, res, next) => {
  try {
    // Token kontrolü
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Lütfen giriş yapın', 401));
    }

    // Token doğrulama
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Kullanıcı kontrolü
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('Kullanıcı bulunamadı', 401));
    }

    // Kullanıcı aktif mi?
    if (!user.isActive) {
      return next(new AppError('Hesabınız devre dışı bırakılmış', 401));
    }

    // Kullanıcıyı request'e ekle
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(handleJWTError());
    }
    if (error.name === 'TokenExpiredError') {
      return next(handleJWTExpiredError());
    }
    next(error);
  }
};

// Rol kontrolü
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Bu işlem için yetkiniz bulunmuyor', 403)
      );
    }
    next();
  };
};

// Kullanıcı türü kontrolü
const restrictToUserType = (...types) => {
  return (req, res, next) => {
    if (!types.includes(req.user.type)) {
      return next(
        new AppError('Bu işlem için yetkiniz bulunmuyor', 403)
      );
    }
    next();
  };
};

// Kaynak sahibi kontrolü
const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) {
        return next(new AppError('Kayıt bulunamadı', 404));
      }

      // Kullanıcı kaynağın sahibi mi?
      if (doc.user.toString() !== req.user.id) {
        return next(
          new AppError('Bu işlem için yetkiniz bulunmuyor', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 5 deneme
  message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // 3 deneme
  message: 'Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin.',
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // 3 deneme
  message: 'Çok fazla şifre sıfırlama denemesi. Lütfen 1 saat sonra tekrar deneyin.',
});

// IP bazlı rate limiting
const ipLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 100, // 100 istek
  message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
});

module.exports = {
  protect,
  restrictTo,
  restrictToUserType,
  checkOwnership,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  ipLimiter,
}; 