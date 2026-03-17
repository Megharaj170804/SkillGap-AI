const Notification = require('../models/Notification');

// GET /api/notifications/:userId
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });
    return res.json(notif);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/notifications/clear/:userId
const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });
    return res.json({ message: 'All notifications cleared.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getNotifications, markAsRead, clearAll };
