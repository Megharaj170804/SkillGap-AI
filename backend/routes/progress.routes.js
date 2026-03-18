const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getProgress, updateProgress, getTeamProgress, logToday, completeResource, logSession } = require('../controllers/progress.controller');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/log-today', verifyToken, authorizeRoles('employee'), logToday);
router.post('/complete-resource', verifyToken, authorizeRoles('employee'), completeResource);
router.post('/log-session', verifyToken, authorizeRoles('employee'), logSession);
router.get('/team/:department', verifyToken, getTeamProgress);
router.get('/:employeeId', verifyToken, getProgress);
router.put('/:employeeId', verifyToken, updateProgress);

module.exports = router;
