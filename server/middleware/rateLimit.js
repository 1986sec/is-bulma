const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../utils/redis');
const config = require('../config');
const logger = require('../utils/logger');

// Create rate limiter
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    keyGenerator = (req) => req.ip,
    skip = (req) => false,
    handler = (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ error: message });
    },
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    keyGenerator,
    skip,
    handler,
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:',
    }),
  });
};

// API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

// Auth rate limiter
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after an hour.',
});

// File upload rate limiter
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many file uploads from this IP, please try again after an hour.',
});

// Search rate limiter
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many search requests from this IP, please try again after a minute.',
});

// Export rate limiters
module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  searchLimiter,
  createRateLimiter,
}; 