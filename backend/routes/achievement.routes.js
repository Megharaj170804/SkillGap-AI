const express = require('express');
const router = express.Router();
const { getAchievements, checkAchievements } = require('../controllers/achievement.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/:employeeId', verifyToken, getAchievements);
router.post('/check/:employeeId', verifyToken, checkAchievements);

module.exports = router;
