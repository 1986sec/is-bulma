const User = require('../models/user');
const logger = require('./logger');
const notification = require('./notification');
const cache = require('./cache');

class UserManager {
  constructor() {
    this.cacheDuration = 300; // 5 dakika
    this.defaultLimit = 10;
    this.maxLimit = 50;
  }

  // Kullanıcı oluştur
  async createUser(data) {
    try {
      const user = await User.create(data);
      await this.clearCache();

      logger.info('Kullanıcı oluşturuldu:', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı güncelle
  async updateUser(id, data) {
    try {
      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await this.clearCache(user.id);

      logger.info('Kullanıcı güncellendi:', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı sil
  async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await this.clearCache(user.id);

      logger.info('Kullanıcı silindi:', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı getir
  async getUser(id) {
    try {
      const user = await User.findById(id);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      logger.info('Kullanıcı getirildi:', {
        userId: user.id,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı listesi
  async getUsers(options = {}) {
    try {
      const cacheKey = `users:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Kullanıcı listesi önbellekten alındı:', {
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
        type,
        status,
        search,
      } = options;

      const query = {};

      if (type) query.type = type;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await User.countDocuments(query);

      const data = {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Kullanıcı listesi alındı:', {
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Kullanıcı listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Aktif kullanıcılar
  async getActiveUsers(options = {}) {
    try {
      const cacheKey = `users:active:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Aktif kullanıcılar önbellekten alındı:', {
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-lastLoginAt',
      } = options;

      const users = await User.find({ status: 'active' })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await User.countDocuments({ status: 'active' });

      const data = {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Aktif kullanıcılar alındı:', {
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Aktif kullanıcılar alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı istatistikleri
  async getUserStats() {
    try {
      const cacheKey = 'users:stats';
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Kullanıcı istatistikleri önbellekten alındı');
        return cachedData;
      }

      const [
        total,
        active,
        inactive,
        verified,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'inactive' }),
        User.countDocuments({ verified: true }),
      ]);

      const stats = {
        total,
        active,
        inactive,
        verified,
        activeRate: total ? (active / total) * 100 : 0,
        inactiveRate: total ? (inactive / total) * 100 : 0,
        verifiedRate: total ? (verified / total) * 100 : 0,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Kullanıcı istatistikleri alındı:', { stats });

      return stats;
    } catch (error) {
      logger.error('Kullanıcı istatistikleri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı durumunu güncelle
  async updateUserStatus(id, status) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      );

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await this.clearCache(user.id);

      logger.info('Kullanıcı durumu güncellendi:', {
        userId: user.id,
        status,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı durumu güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı doğrulama durumunu güncelle
  async updateUserVerification(id, verified) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { verified },
        { new: true },
      );

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await this.clearCache(user.id);

      logger.info('Kullanıcı doğrulama durumu güncellendi:', {
        userId: user.id,
        verified,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı doğrulama durumu güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı son giriş zamanını güncelle
  async updateLastLogin(id) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { lastLoginAt: new Date() },
        { new: true },
      );

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await this.clearCache(user.id);

      logger.info('Kullanıcı son giriş zamanı güncellendi:', {
        userId: user.id,
        lastLoginAt: user.lastLoginAt,
      });

      return user;
    } catch (error) {
      logger.error('Kullanıcı son giriş zamanı güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbelleği temizle
  async clearCache(userId = null) {
    try {
      const keys = ['users:*'];
      if (userId) {
        keys.push(`users:${userId}:*`);
      }

      await cache.del(keys);

      logger.debug('Kullanıcı önbelleği temizlendi:', {
        userId,
        keys,
      });
    } catch (error) {
      logger.error('Kullanıcı önbelleği temizleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new UserManager(); 