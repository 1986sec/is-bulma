import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.js';
import morgan from 'morgan';
import config from './config.js';
import database from './database.js';
import socket from './utils/socket.js';

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info('MongoDB Connected...'))
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Static folder
app.use(express.static(join(__dirname, 'public')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('New client connected:', socket.id);

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/users', (await import('./routes/user.js')).default);
app.use('/api/jobs', (await import('./routes/job.js')).default);
app.use('/api/matches', (await import('./routes/match.js')).default);
app.use('/api/notifications', (await import('./routes/notification.js')).default);
app.use('/api/payments', (await import('./routes/payment.js')).default);
app.use('/api/uploads', (await import('./routes/upload.js')).default);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
}); 