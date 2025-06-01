const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch {
    res.status(500).json({ mesaj: 'Bildirimler alınamadı.' });
  }
}; 