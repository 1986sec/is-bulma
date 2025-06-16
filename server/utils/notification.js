import { logger } from './logger.js';
import { email } from './email.js';
import { socket } from './socket.js';
import { cache } from './cache.js';
import { Notification } from '../models/notification.js';

class NotificationManager {
  constructor() {
    this.cacheDuration = 300; // 5 dakika
    this.defaultLimit = 10;
    this.maxLimit = 50;
  }

  // Bildirim oluştur
  async createNotification(data) {
    try {
      const notification = await Notification.create(data);
      await this.sendNotification(notification);
      await this.clearCache(notification.userId);

      logger.info('Bildirim oluşturuldu:', {
        notificationId: notification.id,
        userId: notification.userId,
      });

      return notification;
    } catch (error) {
      logger.error('Bildirim oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirim gönder
  async sendNotification(notification) {
    try {
      // Socket.IO ile gönder
      await socket.sendToUser(notification.userId, 'notification:receive', notification);

      // E-posta ile gönder
      if (notification.sendEmail) {
        await email.sendNotificationEmail(notification);
      }

      logger.info('Bildirim gönderildi:', {
        notificationId: notification.id,
        userId: notification.userId,
      });
    } catch (error) {
      logger.error('Bildirim gönderme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirim güncelle
  async updateNotification(id, data) {
    try {
      const notification = await Notification.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!notification) {
        throw new Error('Bildirim bulunamadı');
      }

      await this.clearCache(notification.userId);

      logger.info('Bildirim güncellendi:', {
        notificationId: notification.id,
        userId: notification.userId,
      });

      return notification;
    } catch (error) {
      logger.error('Bildirim güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirim sil
  async deleteNotification(id) {
    try {
      const notification = await Notification.findByIdAndDelete(id);

      if (!notification) {
        throw new Error('Bildirim bulunamadı');
      }

      await this.clearCache(notification.userId);

      logger.info('Bildirim silindi:', {
        notificationId: notification.id,
        userId: notification.userId,
      });

      return notification;
    } catch (error) {
      logger.error('Bildirim silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirim getir
  async getNotification(id) {
    try {
      const notification = await Notification.findById(id);

      if (!notification) {
        throw new Error('Bildirim bulunamadı');
      }

      logger.info('Bildirim getirildi:', {
        notificationId: notification.id,
        userId: notification.userId,
      });

      return notification;
    } catch (error) {
      logger.error('Bildirim getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirim listesi
  async getNotifications(userId, options = {}) {
    try {
      const cacheKey = `notifications:${userId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Bildirim listesi önbellekten alındı:', {
          userId,
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
        type,
        read,
      } = options;

      const query = { userId };
      if (type) query.type = type;
      if (read !== undefined) query.read = read;

      const notifications = await Notification.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await Notification.countDocuments(query);

      const data = {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Bildirim listesi alındı:', {
        userId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Bildirim listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Okunmamış bildirim sayısı
  async getUnreadCount(userId) {
    try {
      const cacheKey = `notifications:unread:${userId}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData !== undefined) {
        logger.debug('Okunmamış bildirim sayısı önbellekten alındı:', {
          userId,
        });
        return cachedData;
      }

      const count = await Notification.countDocuments({
        userId,
        read: false,
      });

      await cache.set(cacheKey, count, this.cacheDuration);

      logger.info('Okunmamış bildirim sayısı alındı:', {
        userId,
        count,
      });

      return count;
    } catch (error) {
      logger.error('Okunmamış bildirim sayısı alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirimleri okundu olarak işaretle
  async markAsRead(userId, ids = []) {
    try {
      const query = { userId, read: false };
      if (ids.length > 0) {
        query._id = { $in: ids };
      }

      const result = await Notification.updateMany(query, { read: true });

      await this.clearCache(userId);

      logger.info('Bildirimler okundu olarak işaretlendi:', {
        userId,
        ids,
        count: result.nModified,
      });

      return result;
    } catch (error) {
      logger.error('Bildirimleri okundu olarak işaretleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirimleri sil
  async deleteNotifications(userId, ids = []) {
    try {
      const query = { userId };
      if (ids.length > 0) {
        query._id = { $in: ids };
      }

      const result = await Notification.deleteMany(query);

      await this.clearCache(userId);

      logger.info('Bildirimler silindi:', {
        userId,
        ids,
        count: result.deletedCount,
      });

      return result;
    } catch (error) {
      logger.error('Bildirimleri silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbelleği temizle
  async clearCache(userId) {
    try {
      const keys = [
        `notifications:${userId}:*`,
        `notifications:unread:${userId}`,
      ];

      await cache.del(keys);

      logger.debug('Bildirim önbelleği temizlendi:', {
        userId,
        keys,
      });
    } catch (error) {
      logger.error('Bildirim önbelleği temizleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const notification = new NotificationManager();
export { notification };
export default notification; 