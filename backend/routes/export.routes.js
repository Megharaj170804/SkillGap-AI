const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  exportEmployeePDF,
  exportTeamCSV,
  getAnalytics,
  exportEmployeesCSV,
  exportCompanyReportPDF,
} = require('../controllers/export.controller');

router.get('/employee/:id/pdf', verifyToken, exportEmployeePDF);
router.get('/employees/csv', verifyToken, authorizeRoles('admin'), exportEmployeesCSV);
router.get('/company-report/pdf', verifyToken, authorizeRoles('admin'), exportCompanyReportPDF);
router.get('/team/:dept/csv', verifyToken, authorizeRoles('admin', 'manager'), exportTeamCSV);
router.get('/analytics', verifyToken, authorizeRoles('admin'), getAnalytics);

module.exports = router;
