const logger = require('../utils/logger');

// Özel hata sınıfı
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 hatası
const notFound = (req, res, next) => {
  const error = new AppError(`Sayfa bulunamadı - ${req.originalUrl}`, 404);
  next(error);
};

// Hata işleyici
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Geliştirme ortamında detaylı hata
  if (process.env.NODE_ENV === 'development') {
    logger.error('Hata:', {
      error: err,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Üretim ortamında basitleştirilmiş hata
  if (err.isOperational) {
    logger.error('Operasyonel Hata:', {
      error: err,
      path: req.path,
      method: req.method,
      user: req.user,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programlama hatası
  logger.error('Programlama Hatası:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user,
  });

  return res.status(500).json({
    success: false,
    message: 'Bir şeyler yanlış gitti',
  });
};

// Async hata yakalayıcı
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// MongoDB hata işleyici
const handleMongoError = (err) => {
  let error = err;

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(
      `${field} zaten kullanımda. Lütfen başka bir değer deneyin.`,
      400
    );
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    error = new AppError(errors.join('. '), 400);
  }

  // Cast error
  if (err.name === 'CastError') {
    error = new AppError('Geçersiz veri formatı', 400);
  }

  return error;
};

// JWT hata işleyici
const handleJWTError = () => {
  return new AppError('Geçersiz token. Lütfen tekrar giriş yapın.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token süresi doldu. Lütfen tekrar giriş yapın.', 401);
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  handleMongoError,
  handleJWTError,
  handleJWTExpiredError,
}; 