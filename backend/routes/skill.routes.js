const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const skillController = require('../controllers/skill.controller');

// All skill routes require login and admin role
router.use(verifyToken, authorizeRoles('admin'));

router.get('/', skillController.getAllSkills);
router.get('/sync', skillController.syncSkills);
router.post('/', skillController.createSkill);
router.put('/rename', skillController.updateSkill);
router.delete('/:name', skillController.deleteSkill);

module.exports = router;
