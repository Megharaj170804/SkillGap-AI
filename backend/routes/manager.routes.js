const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(verifyToken);
router.use(authorizeRoles('manager'));

router.get('/my-stats', managerController.getMyStats);
router.get('/my-team', managerController.getMyTeam);
router.get('/skill-coverage', managerController.getSkillCoverage);
router.get('/activity-feed', managerController.getActivityFeed);
router.get('/team-progress', managerController.getTeamProgress);
router.get('/alerts', managerController.getAlerts);
router.get('/team-insights-cache', managerController.getTeamInsightsCache);
router.get('/projects', managerController.getProjects);

router.post('/projects', managerController.createProject);
router.post('/nudge/:employeeId', managerController.sendNudge);

router.put('/team-goal', managerController.setTeamGoal);

router.delete('/alerts/:alertId', managerController.dismissAlert);

// Reports
router.get('/reports/team-summary', managerController.getTeamSummaryReport);
router.get('/reports/team-csv', managerController.getTeamCSVReport);
router.get('/reports/employee/:id', managerController.getEmployeeReport);

module.exports = router;
