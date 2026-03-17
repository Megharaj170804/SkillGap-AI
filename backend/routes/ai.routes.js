const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const rateLimit = require('express-rate-limit');
const {
  generateLearningPath,
  generateCareerAdvice,
  generateSkillRecommendations,
  generateTeamInsights,
  aiChat,
} = require('../controllers/ai.controller');

// Rate limit: 10 requests per minute per user
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || 'guest',
  message: { message: 'Too many AI requests. Please wait a minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/learning-path/:employeeId', verifyToken, aiLimiter, generateLearningPath);
router.post('/career-advice/:employeeId', verifyToken, aiLimiter, generateCareerAdvice);
router.post('/skill-recommendations', verifyToken, aiLimiter, generateSkillRecommendations);
router.post('/team-insights/:department', verifyToken, authorizeRoles('admin', 'manager'), aiLimiter, generateTeamInsights);
router.post('/chat', verifyToken, aiLimiter, aiChat);

module.exports = router;
