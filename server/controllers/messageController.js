const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Mesajları getir
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID\'si gerekli',
      });
    }

    // Mesajları getir
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    // Toplam mesaj sayısını al
    const total = await Message.countDocuments({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar alınırken bir hata oluştu',
    });
  }
};

// @desc    Mesaj gönder
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Alıcı ID ve mesaj içeriği gerekli',
      });
    }

    // Alıcıyı kontrol et
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Alıcı bulunamadı',
      });
    }

    // Mesajı oluştur
    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      content,
    });

    // Mesajı popüle et
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken bir hata oluştu',
    });
  }
};

// @desc    Mesajı okundu olarak işaretle
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı',
      });
    }

    // Yetki kontrolü
    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Mesajı güncelle
    message.read = true;
    await message.save();

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj okundu olarak işaretlenirken bir hata oluştu',
    });
  }
};

// @desc    Mesajı sil
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı',
      });
    }

    // Yetki kontrolü
    if (message.sender.toString() !== req.user.id && message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    await message.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj silinirken bir hata oluştu',
    });
  }
};

// @desc    Sohbet listesini getir
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    // Son mesajları al
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user.id },
            { receiver: req.user.id },
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
              { $eq: ['$sender', req.user.id] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
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
          lastMessage: 1,
          user: {
            _id: 1,
            username: 1,
            avatar: 1,
            isOnline: 1,
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Sohbet listesi alınırken bir hata oluştu',
    });
  }
}; 