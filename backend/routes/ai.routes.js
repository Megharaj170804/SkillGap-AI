const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { aiRateLimit, learningPathRateLimit } = require('../middleware/rateLimit.middleware');

const {
  generateLearningPath,
  generateCareerAdvice,
  generateSkillRecommendations,
  generateTeamInsights,
  generateProjectTrainingPlan,
  aiChat,
} = require('../controllers/ai.controller');

router.post('/learning-path/:employeeId', verifyToken, learningPathRateLimit, generateLearningPath);
router.post('/career-advice/:employeeId', verifyToken, aiRateLimit, generateCareerAdvice);
router.post('/skill-recommendations', verifyToken, aiRateLimit, generateSkillRecommendations);
router.post('/team-insights/:department', verifyToken, authorizeRoles('admin', 'manager'), aiRateLimit, generateTeamInsights);
router.post('/project-training-plan/:projectId', verifyToken, authorizeRoles('admin', 'manager'), aiRateLimit, generateProjectTrainingPlan);
router.post('/chat', verifyToken, aiRateLimit, aiChat);

module.exports = router;
