const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markRead,
  markAllRead,
  clearNotifications,
  createNotification,
} = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/:userId', verifyToken, getNotifications);
router.put('/:id/read', verifyToken, markRead);
router.put('/mark-all-read/:userId', verifyToken, markAllRead);
router.delete('/clear/:userId', verifyToken, clearNotifications);
router.post('/', verifyToken, createNotification);

module.exports = router;
