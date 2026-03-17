const express = require('express');
const router = express.Router();
const { analyzeEmployee, analyzeTeam } = require('../controllers/analysis.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/employee/:employeeId', verifyToken, analyzeEmployee);
router.get('/team/:department', verifyToken, authorizeRoles('admin', 'manager'), analyzeTeam);

module.exports = router;
