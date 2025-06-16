const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('./logger');
const user = require('./user');
const notification = require('./notification');

class AuthManager {
  constructor() {
    this.jwtSecret = config.jwt.secret;
    this.jwtExpiresIn = config.jwt.expiresIn;
    this.saltRounds = 10;
  }

  // Şifre hashle
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);

      logger.debug('Şifre hashleme başarılı');

      return hash;
    } catch (error) {
      logger.error('Şifre hashleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre doğrula
  async comparePassword(password, hash) {
    try {
      const match = await bcrypt.compare(password, hash);

      logger.debug('Şifre doğrulama başarılı:', {
        match,
      });

      return match;
    } catch (error) {
      logger.error('Şifre doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Token oluştur
  generateToken(payload) {
    try {
      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
      });

      logger.debug('Token oluşturma başarılı:', {
        userId: payload.id,
      });

      return token;
    } catch (error) {
      logger.error('Token oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Token doğrula
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);

      logger.debug('Token doğrulama başarılı:', {
        userId: decoded.id,
      });

      return decoded;
    } catch (error) {
      logger.error('Token doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı girişi
  async login(email, password) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const isMatch = await this.comparePassword(password, user.password);

      if (!isMatch) {
        throw new Error('Geçersiz şifre');
      }

      if (user.status !== 'active') {
        throw new Error('Hesap aktif değil');
      }

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        type: user.type,
      });

      await user.updateLastLogin(user.id);

      logger.info('Kullanıcı girişi başarılı:', {
        userId: user.id,
      });

      return {
        user,
        token,
      };
    } catch (error) {
      logger.error('Kullanıcı girişi hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı kaydı
  async register(data) {
    try {
      const existingUser = await User.findOne({ email: data.email });

      if (existingUser) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor');
      }

      const hashedPassword = await this.hashPassword(data.password);

      const user = await user.createUser({
        ...data,
        password: hashedPassword,
      });

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        type: user.type,
      });

      await notification.createNotification({
        userId: user.id,
        type: 'welcome',
        title: 'Hoş Geldiniz',
        message: 'Hesabınız başarıyla oluşturuldu.',
      });

      logger.info('Kullanıcı kaydı başarılı:', {
        userId: user.id,
      });

      return {
        user,
        token,
      };
    } catch (error) {
      logger.error('Kullanıcı kaydı hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre sıfırlama
  async resetPassword(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const resetToken = this.generateToken({
        id: user.id,
        email: user.email,
        type: 'reset',
      });

      await user.updateUser(user.id, {
        resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000), // 1 saat
      });

      await notification.createNotification({
        userId: user.id,
        type: 'password_reset',
        title: 'Şifre Sıfırlama',
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      });

      logger.info('Şifre sıfırlama başarılı:', {
        userId: user.id,
      });

      return resetToken;
    } catch (error) {
      logger.error('Şifre sıfırlama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre güncelleme
  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const isMatch = await this.comparePassword(currentPassword, user.password);

      if (!isMatch) {
        throw new Error('Geçersiz şifre');
      }

      const hashedPassword = await this.hashPassword(newPassword);

      await user.updateUser(userId, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      });

      await notification.createNotification({
        userId: user.id,
        type: 'password_update',
        title: 'Şifre Güncellendi',
        message: 'Şifreniz başarıyla güncellendi.',
      });

      logger.info('Şifre güncelleme başarılı:', {
        userId: user.id,
      });
    } catch (error) {
      logger.error('Şifre güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre sıfırlama doğrulama
  async verifyResetToken(token) {
    try {
      const decoded = this.verifyToken(token);

      if (decoded.type !== 'reset') {
        throw new Error('Geçersiz token');
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (user.resetToken !== token) {
        throw new Error('Geçersiz token');
      }

      if (user.resetTokenExpires < new Date()) {
        throw new Error('Token süresi dolmuş');
      }

      logger.info('Şifre sıfırlama doğrulama başarılı:', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      logger.error('Şifre sıfırlama doğrulama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AuthManager(); 