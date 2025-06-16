const dotenv = require('dotenv');
const path = require('path');
const logger = require('./logger');

class ConfigManager {
  constructor() {
    // .env dosyasını yükle
    dotenv.config({
      path: path.join(__dirname, '../../.env'),
    });

    // Varsayılan değerleri tanımla
    this.defaults = {
      // Uygulama
      NODE_ENV: 'development',
      PORT: 3000,
      APP_URL: 'http://localhost:3000',
      API_URL: 'http://localhost:3000/api',
      CLIENT_URL: 'http://localhost:3001',

      // Veritabanı
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'is_bulma',
      DB_USER: 'postgres',
      DB_PASS: 'postgres',

      // JWT
      JWT_SECRET: 'your-secret-key',
      JWT_EXPIRES_IN: '1d',
      JWT_REFRESH_SECRET: 'your-refresh-secret-key',
      JWT_REFRESH_EXPIRES_IN: '7d',

      // SMTP
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_SECURE: 'false',
      SMTP_USER: 'your-email@gmail.com',
      SMTP_PASS: 'your-password',
      SMTP_FROM: 'your-email@gmail.com',

      // Dosya yükleme
      UPLOAD_DIR: 'uploads',
      MAX_FILE_SIZE: 5242880, // 5MB
      ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',

      // Önbellek
      CACHE_TTL: 600, // 10 dakika
      CACHE_CHECK_PERIOD: 120, // 2 dakika

      // Arama
      SEARCH_PAGE_SIZE: 10,
      SEARCH_MAX_PAGE_SIZE: 100,

      // Güvenlik
      PASSWORD_SALT_ROUNDS: 10,
      RESET_TOKEN_EXPIRES_IN: '1h',
      VERIFICATION_TOKEN_EXPIRES_IN: '24h',

      // Bildirim
      NOTIFICATION_PAGE_SIZE: 20,
      NOTIFICATION_MAX_PAGE_SIZE: 100,

      // Mesaj
      MESSAGE_PAGE_SIZE: 50,
      MESSAGE_MAX_PAGE_SIZE: 200,

      // Log
      LOG_LEVEL: 'info',
      LOG_DIR: 'logs',
      LOG_MAX_SIZE: 5242880, // 5MB
      LOG_MAX_FILES: 5,

      // Analitik
      ANALYTICS_CACHE_TTL: 3600, // 1 saat
      ANALYTICS_PAGE_SIZE: 100,
      ANALYTICS_MAX_PAGE_SIZE: 1000,

      // Ödeme
      STRIPE_SECRET_KEY: 'your-stripe-secret-key',
      STRIPE_WEBHOOK_SECRET: 'your-stripe-webhook-secret',
      STRIPE_CURRENCY: 'try',

      // Socket.IO
      SOCKET_CORS_ORIGIN: '*',
      SOCKET_PING_TIMEOUT: 60000, // 1 dakika
      SOCKET_PING_INTERVAL: 25000, // 25 saniye
    };

    // Yapılandırmayı yükle
    this.load();
  }

  // Yapılandırmayı yükle
  load() {
    try {
      // Tüm değişkenleri kontrol et
      for (const [key, defaultValue] of Object.entries(this.defaults)) {
        if (!process.env[key]) {
          process.env[key] = defaultValue;
          logger.warn(`Yapılandırma değişkeni bulunamadı, varsayılan değer kullanılıyor:`, {
            key,
            value: defaultValue,
          });
        }
      }

      logger.info('Yapılandırma yüklendi');
    } catch (error) {
      logger.error('Yapılandırma yükleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Değer al
  get(key) {
    try {
      const value = process.env[key];
      if (value === undefined) {
        logger.warn('Yapılandırma değişkeni bulunamadı:', { key });
        return this.defaults[key];
      }
      return value;
    } catch (error) {
      logger.error('Yapılandırma değeri alma hatası:', {
        key,
        error: error.message,
      });
      return this.defaults[key];
    }
  }

  // Değer ayarla
  set(key, value) {
    try {
      process.env[key] = value;
      logger.info('Yapılandırma değeri ayarlandı:', { key, value });
    } catch (error) {
      logger.error('Yapılandırma değeri ayarlama hatası:', {
        key,
        value,
        error: error.message,
      });
      throw error;
    }
  }

  // Tüm değerleri al
  getAll() {
    try {
      const config = {};
      for (const key of Object.keys(this.defaults)) {
        config[key] = this.get(key);
      }
      return config;
    } catch (error) {
      logger.error('Tüm yapılandırma değerlerini alma hatası:', {
        error: error.message,
      });
      return this.defaults;
    }
  }

  // Değer var mı kontrol et
  has(key) {
    try {
      return process.env[key] !== undefined;
    } catch (error) {
      logger.error('Yapılandırma değişkeni kontrol hatası:', {
        key,
        error: error.message,
      });
      return false;
    }
  }

  // Değer sil
  delete(key) {
    try {
      delete process.env[key];
      logger.info('Yapılandırma değeri silindi:', { key });
    } catch (error) {
      logger.error('Yapılandırma değeri silme hatası:', {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  // Tüm değerleri sil
  clear() {
    try {
      for (const key of Object.keys(this.defaults)) {
        delete process.env[key];
      }
      logger.info('Tüm yapılandırma değerleri silindi');
    } catch (error) {
      logger.error('Tüm yapılandırma değerlerini silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Değerleri sıfırla
  reset() {
    try {
      this.clear();
      this.load();
      logger.info('Yapılandırma değerleri sıfırlandı');
    } catch (error) {
      logger.error('Yapılandırma değerlerini sıfırlama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Değerleri doğrula
  validate() {
    try {
      const errors = [];
      for (const [key, defaultValue] of Object.entries(this.defaults)) {
        const value = this.get(key);
        if (value === undefined) {
          errors.push(`Yapılandırma değişkeni bulunamadı: ${key}`);
        }
      }

      if (errors.length > 0) {
        logger.error('Yapılandırma doğrulama hatası:', { errors });
        throw new Error('Yapılandırma doğrulama hatası');
      }

      logger.info('Yapılandırma doğrulandı');
      return true;
    } catch (error) {
      logger.error('Yapılandırma doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new ConfigManager(); 