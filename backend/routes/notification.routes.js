const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getNotifications, markAsRead, clearAll } = require('../controllers/notification.controller');

router.get('/:userId', verifyToken, getNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.delete('/clear/:userId', verifyToken, clearAll);

module.exports = router;
