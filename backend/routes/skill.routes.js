const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const skillController = require('../controllers/skill.controller');

router.use(verifyToken);

// Extract authorizeRoles from global apply and explicitly assign it
router.get('/', authorizeRoles('admin', 'manager'), skillController.getAllSkills);
router.get('/sync', authorizeRoles('admin'), skillController.syncSkills);
router.post('/', authorizeRoles('admin'), skillController.createSkill);
router.put('/rename', authorizeRoles('admin'), skillController.updateSkill);
router.delete('/:name', authorizeRoles('admin'), skillController.deleteSkill);

module.exports = router;
