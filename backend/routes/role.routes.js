const express = require('express');
const router = express.Router();
const { getAllRoles, createRole, updateRole, deleteRole } = require('../controllers/role.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', verifyToken, getAllRoles);
router.post('/', verifyToken, authorizeRoles('admin'), createRole);
router.put('/:id', verifyToken, authorizeRoles('admin'), updateRole);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteRole);

module.exports = router;
