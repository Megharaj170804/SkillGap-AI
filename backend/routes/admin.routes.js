const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getReadinessTrend,
  getDeptReadiness,
  getActivityFeed,
  getSkillsAnalytics,
  getEmployeeAnalytics,
  getLearningAnalytics,
  getDeptAnalytics,
  getAIUsage,
  bulkGenerateAIPaths,
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const adminOnly = [verifyToken, authorizeRoles('admin')];

router.get('/stats', ...adminOnly, getAdminStats);
router.get('/readiness-trend', ...adminOnly, getReadinessTrend);
router.get('/dept-readiness', ...adminOnly, getDeptReadiness);
router.get('/activity-feed', ...adminOnly, getActivityFeed);
router.get('/analytics/skills', ...adminOnly, getSkillsAnalytics);
router.get('/analytics/employees', getEmployeeAnalytics);
router.get('/analytics/learning', getLearningAnalytics);
router.get('/analytics/departments', getDeptAnalytics);

// AI usage
router.get('/ai-usage', getAIUsage);
router.post('/bulk-ai-paths', ...adminOnly, bulkGenerateAIPaths);

module.exports = router;
