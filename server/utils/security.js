import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from './config.js';
import { logger } from './logger.js';

class SecurityManager {
  constructor() {
    this.saltRounds = 10;
    this.tokenExpiration = '24h';
    this.refreshTokenExpiration = '7d';
  }

  // Şifre hashleme
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      logger.info('Şifre hashleme başarılı');
      return hash;
    } catch (error) {
      logger.error('Şifre hashleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre doğrulama
  async comparePassword(password, hash) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      logger.info('Şifre doğrulama sonucu:', { isMatch });
      return isMatch;
    } catch (error) {
      logger.error('Şifre doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // JWT token oluşturma
  async generateToken(payload) {
    try {
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: this.tokenExpiration,
      });
      logger.info('JWT token oluşturuldu');
      return token;
    } catch (error) {
      logger.error('JWT token oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Refresh token oluşturma
  async generateRefreshToken(payload) {
    try {
      const token = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: this.refreshTokenExpiration,
      });
      logger.info('Refresh token oluşturuldu');
      return token;
    } catch (error) {
      logger.error('Refresh token oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Token doğrulama
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      logger.info('Token doğrulama başarılı');
      return decoded;
    } catch (error) {
      logger.error('Token doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Refresh token doğrulama
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      logger.info('Refresh token doğrulama başarılı');
      return decoded;
    } catch (error) {
      logger.error('Refresh token doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Güvenli rastgele string oluşturma
  async generateSecureString(length = 32) {
    try {
      const buffer = crypto.randomBytes(length);
      const string = buffer.toString('hex');
      logger.info('Güvenli rastgele string oluşturuldu');
      return string;
    } catch (error) {
      logger.error('Güvenli rastgele string oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // API anahtarı oluşturma
  async generateApiKey() {
    try {
      const prefix = 'is_';
      const random = await this.generateSecureString(24);
      const apiKey = `${prefix}${random}`;
      logger.info('API anahtarı oluşturuldu');
      return apiKey;
    } catch (error) {
      logger.error('API anahtarı oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre sıfırlama tokeni oluşturma
  async generatePasswordResetToken() {
    try {
      const token = await this.generateSecureString(32);
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 saat geçerli

      logger.info('Şifre sıfırlama tokeni oluşturuldu');
      return {
        token,
        expires,
      };
    } catch (error) {
      logger.error('Şifre sıfırlama tokeni oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // E-posta doğrulama tokeni oluşturma
  async generateEmailVerificationToken() {
    try {
      const token = await this.generateSecureString(32);
      const expires = new Date();
      expires.setHours(expires.getHours() + 24); // 24 saat geçerli

      logger.info('E-posta doğrulama tokeni oluşturuldu');
      return {
        token,
        expires,
      };
    } catch (error) {
      logger.error('E-posta doğrulama tokeni oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // IP adresi doğrulama
  async validateIpAddress(ip) {
    try {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

      const isValid = ipv4Regex.test(ip) || ipv6Regex.test(ip);
      logger.info('IP adresi doğrulama sonucu:', { ip, isValid });
      return isValid;
    } catch (error) {
      logger.error('IP adresi doğrulama hatası:', {
        ip,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya güvenlik kontrolü
  async validateFile(file) {
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const isValidType = allowedTypes.includes(file.mimetype);
      const isValidSize = file.size <= maxSize;

      logger.info('Dosya güvenlik kontrolü sonucu:', {
        filename: file.originalname,
        isValidType,
        isValidSize,
      });

      return {
        isValid: isValidType && isValidSize,
        errors: {
          type: !isValidType ? 'Geçersiz dosya tipi' : null,
          size: !isValidSize ? 'Dosya boyutu çok büyük' : null,
        },
      };
    } catch (error) {
      logger.error('Dosya güvenlik kontrolü hatası:', {
        filename: file.originalname,
        error: error.message,
      });
      throw error;
    }
  }

  // XSS koruması
  sanitizeInput(input) {
    try {
      if (typeof input !== 'string') {
        return input;
      }

      const sanitized = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

      logger.info('XSS koruması uygulandı');
      return sanitized;
    } catch (error) {
      logger.error('XSS koruması hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // CSRF token oluşturma
  async generateCsrfToken() {
    try {
      const token = await this.generateSecureString(32);
      logger.info('CSRF token oluşturuldu');
      return token;
    } catch (error) {
      logger.error('CSRF token oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Rate limiting kontrolü
  async checkRateLimit(key, limit, window) {
    try {
      const now = Date.now();
      const windowStart = now - window;

      // TODO: Redis veya başka bir önbellek sistemi kullanılacak
      logger.info('Rate limiting kontrolü yapıldı:', {
        key,
        limit,
        window,
      });

      return {
        isAllowed: true,
        remaining: limit,
        reset: windowStart + window,
      };
    } catch (error) {
      logger.error('Rate limiting kontrolü hatası:', {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  // Sanitize user data
  sanitizeUser(user) {
    try {
      const sanitized = user.toObject();
      delete sanitized.password;
      delete sanitized.refreshToken;
      delete sanitized.resetToken;
      delete sanitized.verificationToken;
      delete sanitized.__v;
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing user data: ${error.message}`);
      throw error;
    }
  }

  // Sanitize company data
  sanitizeCompany(company) {
    try {
      const sanitized = company.toObject();
      delete sanitized.__v;
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing company data: ${error.message}`);
      throw error;
    }
  }

  // Sanitize job data
  sanitizeJob(job) {
    try {
      const sanitized = job.toObject();
      delete sanitized.__v;
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing job data: ${error.message}`);
      throw error;
    }
  }

  // Sanitize application data
  sanitizeApplication(application) {
    try {
      const sanitized = application.toObject();
      delete sanitized.__v;
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing application data: ${error.message}`);
      throw error;
    }
  }

  // Sanitize payment data
  sanitizePayment(payment) {
    try {
      const sanitized = payment.toObject();
      delete sanitized.__v;
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing payment data: ${error.message}`);
      throw error;
    }
  }

  // Sanitize file data
  sanitizeFile(file) {
    try {
      const sanitized = file.toObject();
      delete sanitized.__v;
      return sanitized;
    } catch (error) {
      logger.error(`Error sanitizing file data: ${error.message}`);
      throw error;
    }
  }
}

const security = new SecurityManager();
export { security };
export default security;