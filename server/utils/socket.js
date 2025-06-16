import { Server } from 'socket.io';
import { logger } from './logger.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

class SocketManager {
  constructor() {
    this.io = null;
    this.connections = new Map();
    this.rooms = new Map();
    this.events = new Map();
  }

  // Socket.IO sunucusunu başlat
  initialize(server) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: config.cors.origin,
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      this.io.use(this.authenticate.bind(this));
      this.io.on('connection', this.handleConnection.bind(this));

      logger.info('Socket.IO sunucusu başlatıldı');
    } catch (error) {
      logger.error('Socket.IO sunucusu başlatma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı kimlik doğrulama
  async authenticate(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('Token bulunamadı');
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket kimlik doğrulama hatası:', {
        error: error.message,
      });
      next(new Error('Kimlik doğrulama hatası'));
    }
  }

  // Bağlantı yönetimi
  async handleConnection(socket) {
    try {
      const userId = socket.user.id;
      this.connections.set(userId, socket);

      logger.info('Yeni socket bağlantısı:', {
        userId,
        socketId: socket.id,
      });

      // Kullanıcı odasına katıl
      await this.joinRoom(socket, `user:${userId}`);

      // Olay dinleyicilerini ekle
      this.addEventListeners(socket);

      // Bağlantı koptuğunda
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    } catch (error) {
      logger.error('Socket bağlantı yönetimi hatası:', {
        error: error.message,
      });
      socket.disconnect();
    }
  }

  // Bağlantı kopma yönetimi
  async handleDisconnect(socket) {
    try {
      const userId = socket.user.id;
      this.connections.delete(userId);

      // Odalardan çık
      for (const [roomId, sockets] of this.rooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }

      logger.info('Socket bağlantısı koptu:', {
        userId,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error('Socket bağlantı kopma yönetimi hatası:', {
        error: error.message,
      });
    }
  }

  // Olay dinleyicilerini ekle
  addEventListeners(socket) {
    try {
      // Mesaj gönderme
      socket.on('message:send', async (data) => {
        try {
          const { receiverId, content, type = 'text', file } = data;
          const senderId = socket.user.id;

          // Mesajı kaydet
          const message = await this.saveMessage(senderId, receiverId, content, type, file);

          // Alıcıya gönder
          await this.sendToUser(receiverId, 'message:receive', message);

          // Gönderene onay gönder
          socket.emit('message:sent', message);

          logger.info('Mesaj gönderildi:', {
            messageId: message.id,
            senderId,
            receiverId,
          });
        } catch (error) {
          logger.error('Mesaj gönderme hatası:', {
            error: error.message,
          });
          socket.emit('message:error', {
            error: 'Mesaj gönderilemedi',
          });
        }
      });

      // Mesaj okundu
      socket.on('message:read', async (data) => {
        try {
          const { messageId } = data;
          const userId = socket.user.id;

          // Mesajı okundu olarak işaretle
          await this.markMessageAsRead(messageId, userId);

          // Gönderene bildir
          const message = await this.getMessage(messageId);
          if (message) {
            await this.sendToUser(message.senderId, 'message:read', {
              messageId,
              userId,
            });
          }

          logger.info('Mesaj okundu:', {
            messageId,
            userId,
          });
        } catch (error) {
          logger.error('Mesaj okundu işlemi hatası:', {
            error: error.message,
          });
          socket.emit('message:error', {
            error: 'Mesaj okundu olarak işaretlenemedi',
          });
        }
      });

      // Bildirim gönderme
      socket.on('notification:send', async (data) => {
        try {
          const { userId, type, title, message, data: notificationData } = data;

          // Bildirimi kaydet
          const notification = await this.saveNotification(
            userId,
            type,
            title,
            message,
            notificationData,
          );

          // Kullanıcıya gönder
          await this.sendToUser(userId, 'notification:receive', notification);

          logger.info('Bildirim gönderildi:', {
            notificationId: notification.id,
            userId,
          });
        } catch (error) {
          logger.error('Bildirim gönderme hatası:', {
            error: error.message,
          });
          socket.emit('notification:error', {
            error: 'Bildirim gönderilemedi',
          });
        }
      });

      // Bildirim okundu
      socket.on('notification:read', async (data) => {
        try {
          const { notificationId } = data;
          const userId = socket.user.id;

          // Bildirimi okundu olarak işaretle
          await this.markNotificationAsRead(notificationId, userId);

          logger.info('Bildirim okundu:', {
            notificationId,
            userId,
          });
        } catch (error) {
          logger.error('Bildirim okundu işlemi hatası:', {
            error: error.message,
          });
          socket.emit('notification:error', {
            error: 'Bildirim okundu olarak işaretlenemedi',
          });
        }
      });

      // Odaya katılma
      socket.on('room:join', async (data) => {
        try {
          const { roomId } = data;
          await this.joinRoom(socket, roomId);

          logger.info('Odaya katılma:', {
            userId: socket.user.id,
            roomId,
          });
        } catch (error) {
          logger.error('Odaya katılma hatası:', {
            error: error.message,
          });
          socket.emit('room:error', {
            error: 'Odaya katılınamadı',
          });
        }
      });

      // Odadan çıkma
      socket.on('room:leave', async (data) => {
        try {
          const { roomId } = data;
          await this.leaveRoom(socket, roomId);

          logger.info('Odadan çıkma:', {
            userId: socket.user.id,
            roomId,
          });
        } catch (error) {
          logger.error('Odadan çıkma hatası:', {
            error: error.message,
          });
          socket.emit('room:error', {
            error: 'Odadan çıkılamadı',
          });
        }
      });

      // Özel olay dinleyicisi ekleme
      socket.on('event:add', async (data) => {
        try {
          const { event, handler } = data;
          this.events.set(event, handler);

          logger.info('Özel olay dinleyicisi eklendi:', {
            event,
          });
        } catch (error) {
          logger.error('Özel olay dinleyicisi ekleme hatası:', {
            error: error.message,
          });
          socket.emit('event:error', {
            error: 'Olay dinleyicisi eklenemedi',
          });
        }
      });

      // Özel olay dinleyicisi kaldırma
      socket.on('event:remove', async (data) => {
        try {
          const { event } = data;
          this.events.delete(event);

          logger.info('Özel olay dinleyicisi kaldırıldı:', {
            event,
          });
        } catch (error) {
          logger.error('Özel olay dinleyicisi kaldırma hatası:', {
            error: error.message,
          });
          socket.emit('event:error', {
            error: 'Olay dinleyicisi kaldırılamadı',
          });
        }
      });
    } catch (error) {
      logger.error('Olay dinleyicileri ekleme hatası:', {
        error: error.message,
      });
      socket.disconnect();
    }
  }

  // Kullanıcıya gönder
  async sendToUser(userId, event, data) {
    try {
      const socket = this.connections.get(userId);
      if (socket) {
        socket.emit(event, data);
        logger.debug('Kullanıcıya veri gönderildi:', {
          userId,
          event,
        });
      } else {
        logger.warn('Kullanıcı bağlı değil:', { userId });
      }
    } catch (error) {
      logger.error('Kullanıcıya veri gönderme hatası:', {
        userId,
        event,
        error: error.message,
      });
      throw error;
    }
  }

  // Odaya gönder
  async sendToRoom(roomId, event, data) {
    try {
      this.io.to(roomId).emit(event, data);
      logger.debug('Odaya veri gönderildi:', {
        roomId,
        event,
      });
    } catch (error) {
      logger.error('Odaya veri gönderme hatası:', {
        roomId,
        event,
        error: error.message,
      });
      throw error;
    }
  }

  // Herkese gönder
  async broadcast(event, data) {
    try {
      this.io.emit(event, data);
      logger.debug('Herkese veri gönderildi:', { event });
    } catch (error) {
      logger.error('Herkese veri gönderme hatası:', {
        event,
        error: error.message,
      });
      throw error;
    }
  }

  // Odaya katıl
  async joinRoom(socket, roomId) {
    try {
      socket.join(roomId);
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(socket.id);

      logger.debug('Odaya katılma:', {
        userId: socket.user.id,
        roomId,
      });
    } catch (error) {
      logger.error('Odaya katılma hatası:', {
        userId: socket.user.id,
        roomId,
        error: error.message,
      });
      throw error;
    }
  }

  // Odadan çık
  async leaveRoom(socket, roomId) {
    try {
      socket.leave(roomId);
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(socket.id);
        if (this.rooms.get(roomId).size === 0) {
          this.rooms.delete(roomId);
        }
      }

      logger.debug('Odadan çıkma:', {
        userId: socket.user.id,
        roomId,
      });
    } catch (error) {
      logger.error('Odadan çıkma hatası:', {
        userId: socket.user.id,
        roomId,
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı sayısını al
  async getConnectionCount() {
    try {
      return this.connections.size;
    } catch (error) {
      logger.error('Bağlantı sayısı alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Oda sayısını al
  async getRoomCount() {
    try {
      return this.rooms.size;
    } catch (error) {
      logger.error('Oda sayısı alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Olay sayısını al
  async getEventCount() {
    try {
      return this.events.size;
    } catch (error) {
      logger.error('Olay sayısı alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı listesini al
  async getConnectionList() {
    try {
      return Array.from(this.connections.keys());
    } catch (error) {
      logger.error('Bağlantı listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Oda listesini al
  async getRoomList() {
    try {
      return Array.from(this.rooms.keys());
    } catch (error) {
      logger.error('Oda listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Olay listesini al
  async getEventList() {
    try {
      return Array.from(this.events.keys());
    } catch (error) {
      logger.error('Olay listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const socket = new SocketManager();
export { socket };
export default socket; 