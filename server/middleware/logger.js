const logger = require('../utils/logger');
const config = require('../config');

// Create logger middleware
const createLoggerMiddleware = (options = {}) => {
  const {
    level = 'info',
    skip = (req) => false,
    format = (req, res, duration) => ({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user._id : null,
    }),
  } = options;

  return (req, res, next) => {
    // Skip logging if skip function returns true
    if (skip(req)) {
      return next();
    }

    // Start timer
    const start = Date.now();

    // Log request
    logger[level](`Request started: ${req.method} ${req.originalUrl}`, {
      ...format(req, res, 0),
      type: 'request_start',
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger[level](`Request completed: ${req.method} ${req.originalUrl}`, {
        ...format(req, res, duration),
        type: 'request_end',
      });
    });

    next();
  };
};

// API logger middleware
const apiLogger = createLoggerMiddleware({
  level: 'info',
  skip: (req) => req.path.startsWith('/static'),
  format: (req, res, duration) => ({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user ? req.user._id : null,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  }),
});

// Error logger middleware
const errorLogger = createLoggerMiddleware({
  level: 'error',
  skip: (req) => !req.error,
  format: (req, res, duration) => ({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user ? req.user._id : null,
    error: req.error,
    stack: req.error.stack,
  }),
});

// Auth logger middleware
const authLogger = createLoggerMiddleware({
  level: 'info',
  skip: (req) => !req.path.startsWith('/auth'),
  format: (req, res, duration) => ({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user ? req.user._id : null,
    email: req.body.email,
  }),
});

// Export logger middleware
module.exports = {
  createLoggerMiddleware,
  apiLogger,
  errorLogger,
  authLogger,
}; 