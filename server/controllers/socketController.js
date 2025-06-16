const logger = require('../utils/logger');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Aktif kullanıcıları tutmak için Map
const activeUsers = new Map();

// Socket.IO bağlantı yönetimi
exports.handleConnection = (io) => {
  io.on('connection', async (socket) => {
    try {
      // Kullanıcı kimlik doğrulama
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      // Token'dan kullanıcı bilgilerini al
      const user = await User.findById(token);
      if (!user) {
        socket.disconnect();
        return;
      }

      // Kullanıcıyı aktif kullanıcılar listesine ekle
      activeUsers.set(user._id.toString(), socket.id);
      socket.userId = user._id;

      // Kullanıcının çevrimiçi durumunu güncelle
      await User.findByIdAndUpdate(user._id, { isOnline: true });

      // Kullanıcıya bildirim gönder
      socket.emit('connected', {
        message: 'Bağlantı başarılı',
        userId: user._id,
      });

      // Diğer kullanıcılara bildir
      socket.broadcast.emit('userOnline', {
        userId: user._id,
        username: user.username,
      });

      // Mesaj gönderme
      socket.on('sendMessage', async (data) => {
        try {
          const { receiverId, content } = data;

          // Alıcının çevrimiçi olup olmadığını kontrol et
          const receiverSocketId = activeUsers.get(receiverId);
          const receiver = await User.findById(receiverId);

          if (!receiver) {
            socket.emit('error', { message: 'Alıcı bulunamadı' });
            return;
          }

          // Mesajı kaydet
          const message = await Message.create({
            sender: user._id,
            receiver: receiverId,
            content,
          });

          // Mesajı gönderen kullanıcıya bildir
          socket.emit('messageSent', {
            message,
            status: 'sent',
          });

          // Alıcı çevrimiçi ise mesajı ilet
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', {
              message,
              sender: {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
              },
            });
          }

          // Alıcı çevrimiçi değilse bildirim oluştur
          if (!receiver.isOnline) {
            await Notification.create({
              user: receiverId,
              type: 'message',
              content: `${user.username} size bir mesaj gönderdi`,
              data: {
                messageId: message._id,
                senderId: user._id,
              },
            });
          }
        } catch (error) {
          logger.error('Send message error:', error);
          socket.emit('error', { message: 'Mesaj gönderilemedi' });
        }
      });

      // Mesaj okundu bildirimi
      socket.on('messageRead', async (data) => {
        try {
          const { messageId } = data;

          // Mesajı bul ve güncelle
          const message = await Message.findById(messageId);
          if (!message) {
            socket.emit('error', { message: 'Mesaj bulunamadı' });
            return;
          }

          // Mesajın alıcısı kontrolü
          if (message.receiver.toString() !== user._id.toString()) {
            socket.emit('error', { message: 'Bu mesajı okundu olarak işaretleyemezsiniz' });
            return;
          }

          message.read = true;
          await message.save();

          // Gönderene bildir
          const senderSocketId = activeUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('messageRead', {
              messageId: message._id,
            });
          }
        } catch (error) {
          logger.error('Message read error:', error);
          socket.emit('error', { message: 'Mesaj okundu olarak işaretlenemedi' });
        }
      });

      // Yazıyor bildirimi
      socket.on('typing', (data) => {
        const { receiverId } = data;
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userTyping', {
            userId: user._id,
            username: user.username,
          });
        }
      });

      // Bağlantı kesildiğinde
      socket.on('disconnect', async () => {
        try {
          // Kullanıcıyı aktif kullanıcılar listesinden çıkar
          activeUsers.delete(user._id.toString());

          // Kullanıcının çevrimiçi durumunu güncelle
          await User.findByIdAndUpdate(user._id, { isOnline: false });

          // Diğer kullanıcılara bildir
          socket.broadcast.emit('userOffline', {
            userId: user._id,
          });
        } catch (error) {
          logger.error('Disconnect error:', error);
        }
      });
    } catch (error) {
      logger.error('Socket connection error:', error);
      socket.disconnect();
    }
  });
};

// Aktif kullanıcıları getir
exports.getActiveUsers = () => {
  return Array.from(activeUsers.keys());
};

// Belirli bir kullanıcının çevrimiçi olup olmadığını kontrol et
exports.isUserOnline = (userId) => {
  return activeUsers.has(userId);
}; 