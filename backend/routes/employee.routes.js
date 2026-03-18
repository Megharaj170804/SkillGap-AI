const express = require('express');
const router = express.Router();
const {
  getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, checkEmail,
} = require('../controllers/employee.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/check-email', verifyToken, checkEmail);
router.get('/', verifyToken, authorizeRoles('admin', 'manager'), getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById);
router.post('/', verifyToken, authorizeRoles('admin'), createEmployee);
router.put('/:id', verifyToken, authorizeRoles('admin', 'manager'), updateEmployee);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteEmployee);

module.exports = router;
