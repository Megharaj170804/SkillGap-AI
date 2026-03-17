const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getProgress, updateProgress, getTeamProgress } = require('../controllers/progress.controller');

router.get('/team/:department', verifyToken, getTeamProgress);
router.get('/:employeeId', verifyToken, getProgress);
router.put('/:employeeId', verifyToken, updateProgress);

module.exports = router;
