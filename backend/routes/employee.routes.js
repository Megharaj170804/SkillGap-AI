const express = require('express');
const router = express.Router();
const {
  getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, checkEmail,
  getEmployeeStats, getWeeklyHours, getTodaysFocus, getStreak, setTargetRole,
  getMySkills, addSkill, updateSkill, removeSkill, submitSelfAssessment,
  getLearningPath, completeLearningWeek, skipLearningWeek, getSkillHistory, getLeaderboard,
  saveProjectAnalysis, getSavedProjects,
  updateProfile, setWeeklyHours, updateNotificationPrefs, clearLearningPath, getCertificates
} = require('../controllers/employee.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/check-email', verifyToken, checkEmail);
router.get('/my-stats', verifyToken, authorizeRoles('employee'), getEmployeeStats);
router.get('/weekly-hours', verifyToken, authorizeRoles('employee'), getWeeklyHours);
router.get('/todays-focus', verifyToken, authorizeRoles('employee'), getTodaysFocus);
router.get('/streak/:id', verifyToken, authorizeRoles('employee', 'manager', 'admin'), getStreak);

router.get('/my-skills', verifyToken, authorizeRoles('employee'), getMySkills);
router.put('/add-skill', verifyToken, authorizeRoles('employee'), addSkill);
router.put('/update-skill', verifyToken, authorizeRoles('employee'), updateSkill);
router.put('/remove-skill', verifyToken, authorizeRoles('employee'), removeSkill);
router.put('/self-assessment', verifyToken, authorizeRoles('employee'), submitSelfAssessment);

router.put('/set-target-role', verifyToken, authorizeRoles('employee'), setTargetRole);

router.get('/skill-history/:employeeId', verifyToken, getSkillHistory);

router.get('/learning-path', verifyToken, authorizeRoles('employee'), getLearningPath);
router.put('/learning-path/complete-week', verifyToken, authorizeRoles('employee'), completeLearningWeek);
router.put('/learning-path/skip-week', verifyToken, authorizeRoles('employee'), skipLearningWeek);
router.get('/leaderboard', verifyToken, authorizeRoles('employee', 'manager'), getLeaderboard);

router.get('/saved-projects', verifyToken, authorizeRoles('employee'), getSavedProjects);
router.post('/saved-projects', verifyToken, authorizeRoles('employee'), saveProjectAnalysis);

router.get('/certificates', verifyToken, authorizeRoles('employee'), getCertificates);

router.put('/update-profile', verifyToken, authorizeRoles('employee'), updateProfile);
router.put('/set-weekly-hours', verifyToken, authorizeRoles('employee'), setWeeklyHours);
router.put('/notification-prefs', verifyToken, authorizeRoles('employee'), updateNotificationPrefs);
router.delete('/clear-path', verifyToken, authorizeRoles('employee'), clearLearningPath);

router.get('/', verifyToken, authorizeRoles('admin', 'manager'), getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById);
router.post('/', verifyToken, authorizeRoles('admin'), createEmployee);
router.put('/:id', verifyToken, authorizeRoles('admin', 'manager'), updateEmployee);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteEmployee);

module.exports = router;
