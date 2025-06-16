const redis = require('../utils/redis');
const config = require('../config');
const logger = require('../utils/logger');

// Create cache middleware
const createCacheMiddleware = (options = {}) => {
  const {
    key = (req) => `cache:${req.originalUrl}`,
    duration = 60 * 60, // 1 hour
    skip = (req) => false,
  } = options;

  return async (req, res, next) => {
    try {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip caching if skip function returns true
      if (skip(req)) {
        return next();
      }

      // Generate cache key
      const cacheKey = typeof key === 'function' ? key(req) : key;

      // Check if data exists in cache
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // Store original res.json
      const originalJson = res.json;

      // Override res.json
      res.json = function(data) {
        // Store data in cache
        redis.setex(cacheKey, duration, JSON.stringify(data))
          .catch(error => logger.error(`Error caching data: ${error.message}`));

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error(`Error in cache middleware: ${error.message}`);
      next();
    }
  };
};

// API cache middleware
const apiCache = createCacheMiddleware({
  key: (req) => `api:${req.originalUrl}`,
  duration: 5 * 60, // 5 minutes
  skip: (req) => req.query.noCache === 'true',
});

// User cache middleware
const userCache = createCacheMiddleware({
  key: (req) => `user:${req.user._id}`,
  duration: 15 * 60, // 15 minutes
  skip: (req) => req.method !== 'GET',
});

// Job cache middleware
const jobCache = createCacheMiddleware({
  key: (req) => `job:${req.params.id}`,
  duration: 30 * 60, // 30 minutes
  skip: (req) => req.method !== 'GET',
});

// Company cache middleware
const companyCache = createCacheMiddleware({
  key: (req) => `company:${req.params.id}`,
  duration: 30 * 60, // 30 minutes
  skip: (req) => req.method !== 'GET',
});

// Search cache middleware
const searchCache = createCacheMiddleware({
  key: (req) => `search:${req.query.q}`,
  duration: 60 * 60, // 1 hour
  skip: (req) => !req.query.q,
});

// Export cache middleware
module.exports = {
  createCacheMiddleware,
  apiCache,
  userCache,
  jobCache,
  companyCache,
  searchCache,
}; 