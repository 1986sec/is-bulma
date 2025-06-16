const Message = require('../models/message');
const logger = require('./logger');
const socket = require('./socket');
const notification = require('./notification');
const cache = require('./cache');

class MessageManager {
  constructor() {
    this.cacheDuration = 300; // 5 dakika
    this.defaultLimit = 20;
    this.maxLimit = 100;
  }

  // Mesaj gönder
  async sendMessage(data) {
    try {
      const message = await Message.create(data);
      await this.sendMessageNotification(message);
      await this.clearCache(message.senderId, message.receiverId);

      logger.info('Mesaj gönderildi:', {
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
      });

      return message;
    } catch (error) {
      logger.error('Mesaj gönderme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj bildirimi gönder
  async sendMessageNotification(message) {
    try {
      // Socket.IO ile gönder
      await socket.sendToUser(message.receiverId, 'message:receive', message);

      // Bildirim gönder
      await notification.createNotification({
        userId: message.receiverId,
        type: 'message',
        title: 'Yeni Mesaj',
        message: `${message.senderName} size bir mesaj gönderdi.`,
        data: {
          messageId: message.id,
          senderId: message.senderId,
        },
      });

      logger.info('Mesaj bildirimi gönderildi:', {
        messageId: message.id,
        receiverId: message.receiverId,
      });
    } catch (error) {
      logger.error('Mesaj bildirimi gönderme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj güncelle
  async updateMessage(id, data) {
    try {
      const message = await Message.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!message) {
        throw new Error('Mesaj bulunamadı');
      }

      await this.clearCache(message.senderId, message.receiverId);

      logger.info('Mesaj güncellendi:', {
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
      });

      return message;
    } catch (error) {
      logger.error('Mesaj güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj sil
  async deleteMessage(id) {
    try {
      const message = await Message.findByIdAndDelete(id);

      if (!message) {
        throw new Error('Mesaj bulunamadı');
      }

      await this.clearCache(message.senderId, message.receiverId);

      logger.info('Mesaj silindi:', {
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
      });

      return message;
    } catch (error) {
      logger.error('Mesaj silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj getir
  async getMessage(id) {
    try {
      const message = await Message.findById(id);

      if (!message) {
        throw new Error('Mesaj bulunamadı');
      }

      logger.info('Mesaj getirildi:', {
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
      });

      return message;
    } catch (error) {
      logger.error('Mesaj getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj listesi
  async getMessages(userId, options = {}) {
    try {
      const cacheKey = `messages:${userId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Mesaj listesi önbellekten alındı:', {
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
        search,
      } = options;

      const query = {
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ],
      };

      if (type) query.type = type;
      if (read !== undefined) query.read = read;
      if (search) {
        query.$or.push(
          { content: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
        );
      }

      const messages = await Message.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await Message.countDocuments(query);

      const data = {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Mesaj listesi alındı:', {
        userId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Mesaj listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Konuşma listesi
  async getConversations(userId, options = {}) {
    try {
      const cacheKey = `conversations:${userId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Konuşma listesi önbellekten alındı:', {
          userId,
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-updatedAt',
      } = options;

      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId },
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverId',
                '$senderId',
              ],
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$receiverId', userId] },
                      { $eq: ['$read', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            _id: 1,
            user: {
              _id: 1,
              name: 1,
              email: 1,
              avatar: 1,
            },
            lastMessage: 1,
            unreadCount: 1,
          },
        },
        {
          $sort: { 'lastMessage.createdAt': -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: Math.min(limit, this.maxLimit),
        },
      ]);

      const total = await Message.distinct('senderId', {
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ],
      }).length;

      const data = {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Konuşma listesi alındı:', {
        userId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Konuşma listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Okunmamış mesaj sayısı
  async getUnreadCount(userId) {
    try {
      const cacheKey = `messages:unread:${userId}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData !== undefined) {
        logger.debug('Okunmamış mesaj sayısı önbellekten alındı:', {
          userId,
        });
        return cachedData;
      }

      const count = await Message.countDocuments({
        receiverId: userId,
        read: false,
      });

      await cache.set(cacheKey, count, this.cacheDuration);

      logger.info('Okunmamış mesaj sayısı alındı:', {
        userId,
        count,
      });

      return count;
    } catch (error) {
      logger.error('Okunmamış mesaj sayısı alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesajları okundu olarak işaretle
  async markAsRead(userId, ids = []) {
    try {
      const query = { receiverId: userId, read: false };
      if (ids.length > 0) {
        query._id = { $in: ids };
      }

      const result = await Message.updateMany(query, { read: true });

      await this.clearCache(userId);

      logger.info('Mesajlar okundu olarak işaretlendi:', {
        userId,
        ids,
        count: result.nModified,
      });

      return result;
    } catch (error) {
      logger.error('Mesajları okundu olarak işaretleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesajları sil
  async deleteMessages(userId, ids = []) {
    try {
      const query = {
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ],
      };
      if (ids.length > 0) {
        query._id = { $in: ids };
      }

      const result = await Message.deleteMany(query);

      await this.clearCache(userId);

      logger.info('Mesajlar silindi:', {
        userId,
        ids,
        count: result.deletedCount,
      });

      return result;
    } catch (error) {
      logger.error('Mesajları silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbelleği temizle
  async clearCache(userId1, userId2 = null) {
    try {
      const keys = [
        `messages:${userId1}:*`,
        `messages:unread:${userId1}`,
        `conversations:${userId1}:*`,
      ];

      if (userId2) {
        keys.push(
          `messages:${userId2}:*`,
          `messages:unread:${userId2}`,
          `conversations:${userId2}:*`,
        );
      }

      await cache.del(keys);

      logger.debug('Mesaj önbelleği temizlendi:', {
        userId1,
        userId2,
        keys,
      });
    } catch (error) {
      logger.error('Mesaj önbelleği temizleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new MessageManager(); 