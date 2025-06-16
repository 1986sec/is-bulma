import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Uygulama ayarları
  app: {
    name: process.env.APP_NAME || 'İş Bulma Platformu',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    url: process.env.APP_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:8080',
  },

  // Veritabanı ayarları
  database: {
    uri: process.env.MONGODB_URI || 'MONGODB_URI=mongodb+srv://1986sec:u9J8d15osrzj1QhU@cluster0.3j20qye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      autoIndex: process.env.NODE_ENV === 'development',
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      family: 4,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    },
  },

  // Redis ayarları
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0,
  },

  // JWT ayarları
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // E-posta ayarları
  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER || 'your-email@gmail.com',
      pass: process.env.MAIL_PASS || 'your-password',
    },
    from: process.env.MAIL_FROM || 'your-email@gmail.com',
  },

  // Dosya yükleme ayarları
  upload: {
    dir: path.join(process.cwd(), 'uploads'),
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },

  // Log ayarları
  log: {
    dir: path.join(process.cwd(), 'logs'),
    level: process.env.LOG_LEVEL || 'info',
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
  },

  // Önbellek ayarları
  cache: {
    ttl: 300, // 5 dakika
    maxTtl: 86400, // 24 saat
  },

  // Socket.IO ayarları
  socket: {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:8080',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  },

  // Güvenlik ayarları
  security: {
    bcryptSaltRounds: 10,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 dakika
      max: 100, // IP başına istek sayısı
    },
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:8080',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  },

  // İş ilanı ayarları
  job: {
    maxApplications: 100,
    maxActiveJobs: 10,
    maxJobDuration: 30, // gün
  },

  // Şirket ayarları
  company: {
    maxActiveJobs: 10,
    maxJobDuration: 30, // gün
  },

  // Kullanıcı ayarları
  user: {
    maxActiveApplications: 10,
    maxSavedJobs: 50,
  },

  // Bildirim ayarları
  notification: {
    maxUnread: 100,
    maxTotal: 1000,
  },

  // Mesaj ayarları
  message: {
    maxUnread: 100,
    maxTotal: 1000,
  },

  // Arama ayarları
  search: {
    maxResults: 100,
    maxSuggestions: 10,
  },

  // İstatistik ayarları
  stats: {
    updateInterval: 3600, // saniye
    maxHistory: 30, // gün
  },

  // Ödeme ayarları
  payment: {
    currency: 'TRY',
    minAmount: 1,
    maxAmount: 10000,
  },

  // Dosya işlemleri ayarları
  file: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    imageSizes: {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
    },
  },
};

export { config };
export default config; 