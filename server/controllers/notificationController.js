const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { type, read, sort = 'newest', page = 1, limit = 10 } = req.query;

    // Build query
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query
    const notifications = await Notification.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count and unread count
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    // Check ownership
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    // Check ownership
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Update notification
    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi',
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    // Check ownership
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler silindi',
    });
  } catch (error) {
    logger.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
}; 