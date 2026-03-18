const Notification = require('../models/Notification');

// GET /api/notifications/:userId
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { read } = req.query;
    let query = { userId };
    if (read === 'false') query.isRead = false;
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
    return res.json(notifications);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/mark-all-read/:userId
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/notifications/clear/:userId
const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });
    return res.json({ message: 'Notifications cleared.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/notifications (internal helper)
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const notif = await Notification.create({ userId, title, message, type });
    return res.status(201).json(notif);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getNotifications, markRead, markAllRead, clearNotifications, createNotification };
