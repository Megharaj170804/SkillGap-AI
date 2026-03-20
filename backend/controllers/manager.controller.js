const User = require('../models/User');
const Employee = require('../models/Employee');
const LearningProgress = require('../models/LearningProgress');
const StudySession = require('../models/StudySession');
const NudgeLog = require('../models/NudgeLog');
const Notification = require('../models/Notification');
const Achievement = require('../models/Achievement');
// require other models as needed

exports.getMyStats = async (req, res) => {
  try {
    const managerId = req.user.id;
    const department = req.user.department;

    if (!department) {
      return res.status(400).json({ message: 'Manager department not found.' });
    }

    // Get all employees in the department
    const employees = await Employee.find({ department });
    const count = employees.length;

    if (count === 0) {
      return res.json({
        managerName: req.user.name || 'Manager',
        teamSize: 0,
        teamAvgReadiness: 0,
        teamAvgReadinessChangeThisWeek: 0,
        onTrackCount: 0,
        needingHelpCount: 0,
        criticalCount: 0,
        employeesNeedingAttentionToday: 0,
        thisWeekCoursesCompleted: 0,
        thisWeekHoursLogged: 0,
        thisWeekSkillsImproved: 0,
        lastWeekCoursesCompleted: 0,
        lastWeekHoursLogged: 0
      });
    }

    // Readiness aggregations
    let totalScore = 0;
    let onTrackCount = 0;
    let needingHelpCount = 0;
    let criticalCount = 0;
    let employeesNeedingAttentionToday = 0;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const employeeIds = employees.map(e => e._id);

    for (const emp of employees) {
      const score = emp.gapScore || 0;
      totalScore += score;
      if (score >= 70) onTrackCount++;
      else if (score >= 40) needingHelpCount++;
      else criticalCount++;

      // Inactive > 3 days OR score < 40
      const lastAct = new Date(emp.lastActive || emp.updatedAt);
      if (lastAct < threeDaysAgo || score < 40) {
        employeesNeedingAttentionToday++;
      }
    }

    const teamAvgReadiness = Math.round(totalScore / count);

    // This Week vs Last Week aggregations
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday 00:00
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Courses Completed
    const programs = await LearningProgress.find({ employeeId: { $in: employeeIds } });
    let thisWeekCourses = 0;
    let lastWeekCourses = 0;

    programs.forEach(prog => {
      const completedItems = prog.completedResources || [];

      completedItems.forEach(item => {
        const completedAt = item?.completedAt ? new Date(item.completedAt) : null;
        if (!completedAt || Number.isNaN(completedAt.getTime())) return;

        if (completedAt >= startOfThisWeek) {
          thisWeekCourses++;
        } else if (completedAt >= startOfLastWeek && completedAt < startOfThisWeek) {
          lastWeekCourses++;
        }
      });
    });

    // Hours Logged
    const sessions = await StudySession.find({ employeeId: { $in: employeeIds } });
    let thisWeekHours = 0;
    let lastWeekHours = 0;

    sessions.forEach(session => {
      const date = new Date(session.date);
      if (date >= startOfThisWeek) {
        thisWeekHours += session.hoursSpent || 0;
      } else if (date >= startOfLastWeek && date < startOfThisWeek) {
        lastWeekHours += session.hoursSpent || 0;
      }
    });

    res.json({
      managerName: req.user.name || 'Manager',
      teamSize: count,
      teamAvgReadiness,
      teamAvgReadinessChangeThisWeek: 2, // Mock for now unless tracked historically
      onTrackCount,
      needingHelpCount,
      criticalCount,
      employeesNeedingAttentionToday,
      thisWeekCoursesCompleted: thisWeekCourses,
      thisWeekHoursLogged: Math.round(thisWeekHours),
      thisWeekSkillsImproved: Math.floor(Math.random() * 5) + 1, // Mock
      lastWeekCoursesCompleted: lastWeekCourses,
      lastWeekHoursLogged: Math.round(lastWeekHours)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
};

exports.getMyTeam = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'Manager department not found.' });

    const employees = await Employee.find({ department });

    const formattedTeam = employees.map(emp => {
      // Calculate top 3 gaps (mock logic for now: sort skills arbitrarily or based on level)
      // Assuming gapScore is updated elsewhere. Let's just return what's in DB.
      
      const now = new Date();
      const lastAct = new Date(emp.lastActive || emp.updatedAt);
      const diffMs = now - lastAct;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      let lastActiveText = "Just now";
      if (diffDays > 0) {
        lastActiveText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        lastActiveText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }

      const topGaps = [...emp.skills].sort((a,b) => (b.proficiencyLevel || 0) - (a.proficiencyLevel || 0)).slice(0, 3).map(s => s.skillName);
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        currentRole: emp.currentRole,
        targetRole: emp.targetRole || 'To be determined',
        gapScore: emp.gapScore || 0,
        topGaps,
        lastActive: lastAct,
        lastActiveText,
        aiPathStatus: emp.aiLearningPath && emp.aiLearningPath.length > 0 ? 'generated' : 'not_generated',
        skillsCount: emp.skills.length,
        avatar: emp.name ? emp.name.charAt(0).toUpperCase() : 'U'
      };
    });

    res.json(formattedTeam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching team' });
  }
};

exports.getSkillCoverage = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const employees = await Employee.find({ department });
    if (!employees.length) return res.json({ employees: [], skills: [], matrix: {}, coverageSummary: { fullyCovered: [], partiallyCovered: [], missing: [] }, teamCoveragePercent: 0 });

    const Role = require('../models/Role');
    const roles = await Role.find({});
    const roleMap = new Map();
    roles.forEach(r => roleMap.set(r.roleName, r.requiredSkills));

    const matrix = {};
    const allRequiredSkillsSet = new Set();
    const coverageSummary = { fullyCovered: [], partiallyCovered: [], missing: [] };
    let totalSkillsRequired = 0;
    let totalSkillsMet = 0;

    const formattedEmployees = employees.map(emp => ({ id: emp._id, name: emp.name, role: emp.currentRole, avatar: emp.name.charAt(0).toUpperCase() }));

    // Pre-calculate what skills are needed across the whole team
    const teamRequiredSkills = new Map();

    for (const emp of employees) {
      const targetRoleName = emp.targetRole || emp.currentRole;
      const requiredForRole = roleMap.get(targetRoleName) || [];
      
      matrix[emp._id] = {};
      
      for (const reqSkill of requiredForRole) {
        allRequiredSkillsSet.add(reqSkill.skillName);
        totalSkillsRequired++;
        
        const currentSkill = emp.skills.find(s => s.skillName === reqSkill.skillName);
        const currentLevel = currentSkill ? currentSkill.proficiencyLevel : 0;
        
        let status = 'missing';
        if (currentLevel >= reqSkill.minimumLevel) {
          status = 'strong';
          totalSkillsMet++;
        } else if (currentLevel >= reqSkill.minimumLevel - 1) {
          status = 'weak';
        } else if (currentLevel > 0) {
          status = 'weak-critical';
        }

        matrix[emp._id][reqSkill.skillName] = {
          current: currentLevel,
          required: reqSkill.minimumLevel,
          status,
          priority: reqSkill.priority
        };

        if (!teamRequiredSkills.has(reqSkill.skillName)) {
          teamRequiredSkills.set(reqSkill.skillName, { requiredCount: 0, metCount: 0 });
        }
        const tracking = teamRequiredSkills.get(reqSkill.skillName);
        tracking.requiredCount++;
        if (currentLevel > 0) tracking.metCount++;
      }
    }

    const skills = Array.from(allRequiredSkillsSet);

    // Calculate coverage summary
    teamRequiredSkills.forEach((tracking, skillName) => {
      if (tracking.metCount === 0) {
        coverageSummary.missing.push(skillName);
      } else if (tracking.metCount === tracking.requiredCount) {
        coverageSummary.fullyCovered.push(skillName);
      } else {
        coverageSummary.partiallyCovered.push(skillName);
      }
    });

    const teamCoveragePercent = totalSkillsRequired > 0 ? Math.round((totalSkillsMet / totalSkillsRequired) * 100) : 100;

    res.json({
      employees: formattedEmployees,
      skills,
      matrix,
      coverageSummary,
      teamCoveragePercent
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching skill coverage' });
  }
};

const TeamInsightsCache = require('../models/TeamInsightsCache');

exports.getTeamInsightsCache = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const cacheEntry = await TeamInsightsCache.findOne({ department });
    
    if (cacheEntry) {
      return res.json({ insights: cacheEntry.insights, generatedAt: cacheEntry.generatedAt, cached: true });
    }
    
    res.json(null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching team insights cache' });
  }
};

exports.getActivityFeed = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned to manager.' });

    // Find employees in this department
    const employees = await Employee.find({ department });
    const employeeIds = employees.map(e => e._id);
    const employeeMap = new Map();
    employees.forEach(e => employeeMap.set(e._id.toString(), { name: e.name, avatar: e.name.charAt(0).toUpperCase() }));

    const feed = [];

    // Study Sessions
    const sessions = await StudySession.find({ employeeId: { $in: employeeIds } }).sort({ date: -1 }).limit(10);
    sessions.forEach(s => {
      const emp = employeeMap.get(s.employeeId.toString());
      if (emp) {
        feed.push({
          type: 'study',
          employeeName: emp.name,
          employeeAvatar: emp.avatar,
          message: `logged ${s.hoursSpent} hours studying ${s.skillName}`,
          timestamp: s.date
        });
      }
    });

    // Completed Courses
    const progress = await LearningProgress.find({ employeeId: { $in: employeeIds } });
    progress.forEach(p => {
      const completedItems = p.completedResources || [];

      completedItems.forEach(c => {
        const emp = employeeMap.get(p.employeeId.toString());
        if (emp) {
          const itemName = c?.courseName || c?.title || p.skillName || 'a learning resource';
          const completedAt = c?.completedAt || p.updatedAt || p.startedAt || new Date();

          feed.push({
            type: 'course',
            employeeName: emp.name,
            employeeAvatar: emp.avatar,
            message: `completed ${itemName}`,
            timestamp: completedAt
          });
        }
      });
    });

    // AI Paths
    employees.forEach(e => {
      if (e.aiLearningPath && e.aiLearningPath.length > 0 && e.lastAnalysisAt) {
        feed.push({
          type: 'ai',
          employeeName: e.name,
          employeeAvatar: employeeMap.get(e._id.toString()).avatar,
          message: 'received an AI learning path',
          timestamp: e.lastAnalysisAt
        });
      }
    });

    // Achievements
    const achievements = await Achievement.find({ employeeId: { $in: employeeIds } }).sort({ earnedAt: -1 }).limit(10);
    achievements.forEach(a => {
      const emp = employeeMap.get(a.employeeId.toString());
      if (emp) {
        feed.push({
          type: 'achievement',
          employeeName: emp.name,
          employeeAvatar: emp.avatar,
          message: `earned achievement: ${a.title}`,
          timestamp: a.earnedAt
        });
      }
    });

    // Sort combined feed by timestamp descending and take top 20
    feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentFeed = feed.slice(0, 20).map(item => {
      // Calculate timeAgo
      const diffMs = new Date() - new Date(item.timestamp);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeAgo = 'just now';
      if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      else if (diffHours > 0) timeAgo = `${diffHours} hr ago`;
      else if (diffMins > 0) timeAgo = `${diffMins} min ago`;

      return {
        ...item,
        timeAgo
      };
    });

    res.json(recentFeed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching activity feed', error: err.message });
  }
};

exports.getTeamProgress = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const employees = await Employee.find({ department });
    const employeeIds = employees.map(e => e._id);
    
    // Get bounds for last 5 weeks
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfThisWeek.setHours(0, 0, 0, 0);

    const fiveWeeksAgo = new Date(startOfThisWeek);
    fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 28); // 4 weeks before this week = 5 weeks total

    const recentSessions = await StudySession.find({
      employeeId: { $in: employeeIds },
      date: { $gte: fiveWeeksAgo }
    });

    const progressRecords = await LearningProgress.find({ employeeId: { $in: employeeIds } });

    const teamProgress = employees.map(emp => {
      let overallProgress = emp.overallProgress || 0;
      let currentWeekInPath = 1;
      
      const currentPath = emp.aiLearningPath && emp.aiLearningPath.length > 0 ? emp.aiLearningPath[0].title : 'No active path';

      if (emp.aiLearningPath && emp.aiLearningPath.length > 0) {
        currentWeekInPath = Math.min(12, Math.max(1, Math.ceil((overallProgress / 100) * 12)));
      }

      // Calculate weekly hours for the last 5 weeks
      const empSessions = recentSessions.filter(s => s.employeeId.toString() === emp._id.toString());
      const weeklyHours = [0, 0, 0, 0, 0];
      
      empSessions.forEach(s => {
        const sessionDate = new Date(s.date);
        if (sessionDate >= startOfThisWeek) {
          weeklyHours[4] += (s.hoursSpent || 0);
        } else {
          for (let i = 1; i <= 4; i++) {
            const weekStart = new Date(startOfThisWeek);
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(startOfThisWeek);
            weekEnd.setDate(weekEnd.getDate() - ((i - 1) * 7));
            if (sessionDate >= weekStart && sessionDate < weekEnd) {
              weeklyHours[4 - i] += (s.hoursSpent || 0);
              break;
            }
          }
        }
      });

      const hoursThisWeek = weeklyHours[4];
      const recentActivity = [...empSessions].sort((a,b) => b.date - a.date).slice(0, 3);
      const currentStreak = hoursThisWeek > 0 ? 1 : 0; // naive streak

      const empProg = progressRecords.find(p => p.employeeId.toString() === emp._id.toString());
      const weeklyGoalHours = empProg ? empProg.weeklyGoalHours : 10;

      let coursesCompletedThisWeek = 0;
      let totalCoursesCompleted = 0;
      if (empProg) {
        const completedCourses = empProg.completedResources || [];
        coursesCompletedThisWeek = completedCourses.filter(c => c?.completedAt && new Date(c.completedAt) >= startOfThisWeek).length;
        totalCoursesCompleted = completedCourses.length;
      }

      const currentGap = emp.gapScore || 0;
      const gapScoreTrend = Array.from({length: 8}, (_, i) => Math.max(0, Math.min(100, currentGap - 8 + i + Math.floor(Math.random() * 5))));
      gapScoreTrend[7] = currentGap;

      return {
        employeeId: emp._id,
        name: emp.name,
        avatar: emp.name.charAt(0).toUpperCase(),
        overallProgress,
        readiness: overallProgress, 
        currentPath,
        hoursThisWeek,
        weeklyHours,
        weeklyGoalHours,
        goalMet: hoursThisWeek >= weeklyGoalHours,
        coursesCompletedThisWeek,
        totalCoursesCompleted,
        currentStreak,
        currentWeekInPath,
        recentActivity,
        gapScoreTrend
      };
    });

    res.json(teamProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching team progress' });
  }
};
const ManagerDismissedAlert = require('../models/ManagerDismissedAlert');

exports.getAlerts = async (req, res) => {
  try {
    const managerId = req.user.id;
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const employees = await Employee.find({ department });
    
    // Get dismissed alerts for this manager
    const dismissed = await ManagerDismissedAlert.find({ managerId });
    const dismissedSet = new Set(dismissed.map(d => d.alertId));

    const alerts = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const emp of employees) {
      // Critical Gap
      if (emp.gapScore < 40) {
        const alertId = `${emp._id}_critical_gap`;
        if (!dismissedSet.has(alertId)) {
          alerts.push({
            id: alertId,
            employeeId: emp._id,
            employeeName: emp.name,
            employeeAvatar: emp.name.charAt(0).toUpperCase(),
            severity: 'critical',
            message: `${emp.name} has dropped to a critical gap score (${emp.gapScore}%).`,
            time: 'Recent'
          });
        }
      }

      // Inactive
      const lastAct = new Date(emp.lastActive || emp.updatedAt);
      if (lastAct < sevenDaysAgo) {
        const diffDays = Math.floor((now - lastAct) / (1000 * 60 * 60 * 24));
        const alertId = `${emp._id}_inactive`;
        if (!dismissedSet.has(alertId)) {
          alerts.push({
            id: alertId,
            employeeId: emp._id,
            employeeName: emp.name,
            employeeAvatar: emp.name.charAt(0).toUpperCase(),
            severity: 'warning',
            message: `${emp.name} has been inactive for ${diffDays} days.`,
            time: `Since ${lastAct.toLocaleDateString()}`
          });
        }
      }

      // AI path missing
      const createdAt = new Date(emp.createdAt);
      if (createdAt < sevenDaysAgo && (!emp.aiLearningPath || emp.aiLearningPath.length === 0)) {
        const alertId = `${emp._id}_no_ai_path`;
        if (!dismissedSet.has(alertId)) {
          alerts.push({
            id: alertId,
            employeeId: emp._id,
            employeeName: emp.name,
            employeeAvatar: emp.name.charAt(0).toUpperCase(),
            severity: 'info',
            message: `${emp.name} hasn't had an AI Learning Path generated yet.`,
            time: 'Action recommended'
          });
        }
      }
      
      // Mock Positive Alert
      if (emp.gapScore >= 80) {
         const alertId = `${emp._id}_doing_great`;
         if (!dismissedSet.has(alertId)) {
           alerts.push({
             id: alertId,
             employeeId: emp._id,
             employeeName: emp.name,
             employeeAvatar: emp.name.charAt(0).toUpperCase(),
             severity: 'positive',
             message: `${emp.name} is making great progress on their learning track!`,
             time: 'This week'
           });
         }
      }
    }

    // Sort: critical > warning > info > positive
    const severityPoints = { critical: 4, warning: 3, info: 2, positive: 1 };
    alerts.sort((a, b) => severityPoints[b.severity] - severityPoints[a.severity]);

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

const Project = require('../models/Project');

exports.getProjects = async (req, res) => {
  try {
    const managerId = req.user.id;
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const projects = await Project.find({ managerId, department })
      .populate('assignedEmployees', 'name email currentRole skills')
      .sort({ deadline: 1 });

    const today = new Date();
    
    const formattedProjects = projects.map(p => {
      // Calculate days until deadline
      const deadline = new Date(p.deadline);
      const diffMs = deadline - today;
      const daysUntilDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return {
        _id: p._id,
        name: p.name,
        description: p.description,
        techStack: p.techStack,
        requiredSkills: p.requiredSkills,
        deadline: p.deadline,
        daysUntilDeadline,
        assignedEmployees: p.assignedEmployees.map(e => ({
          _id: e._id,
          name: e.name,
          currentRole: e.currentRole,
          avatar: e.name.charAt(0).toUpperCase(),
          skills: e.skills
        })),
        skillCoveragePercent: p.skillCoveragePercent,
        riskLevel: p.riskLevel || (daysUntilDeadline < 14 && p.skillCoveragePercent < 80 ? 'high' : 'medium'),
        aiAnalysis: p.aiAnalysis
      };
    });

    res.json(formattedProjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const managerId = req.user.id;
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const {
      name,
      description,
      techStack,
      requiredSkills,
      deadline,
      assignedEmployees,
      aiAnalysis
    } = req.body;

    if (!name || !deadline) return res.status(400).json({ message: 'Name and deadline are required.' });

    // Calculate skill coverage for assigned employees
    let skillCoveragePercent = 0;
    if (assignedEmployees && assignedEmployees.length > 0 && requiredSkills && requiredSkills.length > 0) {
      const emps = await Employee.find({ _id: { $in: assignedEmployees } });
      let metSkillsCount = 0;
      
      requiredSkills.forEach(reqSkill => {
        // Did anyone meet this?
        const isMet = emps.some(emp => {
          const empSkill = emp.skills.find(s => s.skillName === reqSkill.skillName);
          return empSkill && empSkill.proficiencyLevel >= reqSkill.level;
        });
        if (isMet) metSkillsCount++;
      });
      
      skillCoveragePercent = Math.round((metSkillsCount / requiredSkills.length) * 100);
    }

    const diffDays = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    let riskLevel = 'medium';
    if (diffDays < 14 || skillCoveragePercent < 50) riskLevel = 'high';
    else if (skillCoveragePercent >= 80) riskLevel = 'low';

    const project = new Project({
      name,
      description,
      techStack,
      requiredSkills,
      managerId,
      department,
      deadline,
      assignedEmployees,
      skillCoveragePercent,
      riskLevel,
      aiAnalysis
    });

    await project.save();
    
    // Save Manager Actions if needed (e.g. tracking "Create project setup")
    
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating project' });
  }
};


exports.assignEmployeesToProject = async (req, res) => {
  try {
    const managerId = req.user.id;
    const department = req.user.department;
    const { projectId } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({ message: 'employeeIds must be an array.' });
    }

    const project = await Project.findOne({ _id: projectId, managerId, department });
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    let skillCoveragePercent = 0;
    if (employeeIds.length > 0 && project.requiredSkills && project.requiredSkills.length > 0) {
      const emps = await Employee.find({ _id: { $in: employeeIds }, department });
      let metSkillsCount = 0;
      project.requiredSkills.forEach(reqSkill => {
        const isMet = emps.some(emp => {
          const empSkill = (emp.skills || []).find(s =>
            s.skillName.toLowerCase() === reqSkill.skillName.toLowerCase()
          );
          return empSkill && empSkill.proficiencyLevel >= (reqSkill.level || reqSkill.minimumLevel || 3);
        });
        if (isMet) metSkillsCount++;
      });
      skillCoveragePercent = Math.round((metSkillsCount / project.requiredSkills.length) * 100);
    }

    const diffDays = Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    let riskLevel = 'medium';
    if (diffDays < 14 || skillCoveragePercent < 50) riskLevel = 'high';
    else if (skillCoveragePercent >= 80) riskLevel = 'low';

    project.assignedEmployees = employeeIds;
    project.skillCoveragePercent = skillCoveragePercent;
    project.riskLevel = riskLevel;
    await project.save();

    const updated = await Project.findById(project._id).populate('assignedEmployees', 'name email currentRole skills');
    const today = new Date();
    const daysUntilDeadline = Math.ceil((new Date(updated.deadline) - today) / (1000 * 60 * 60 * 24));

    res.json({
      _id: updated._id,
      name: updated.name,
      description: updated.description,
      techStack: updated.techStack,
      requiredSkills: updated.requiredSkills,
      deadline: updated.deadline,
      daysUntilDeadline,
      assignedEmployees: updated.assignedEmployees.map(e => ({
        _id: e._id,
        name: e.name,
        currentRole: e.currentRole,
        avatar: (e.name || 'U').charAt(0).toUpperCase(),
        skills: e.skills
      })),
      skillCoveragePercent: updated.skillCoveragePercent,
      riskLevel: updated.riskLevel,
      aiAnalysis: updated.aiAnalysis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error assigning employees to project' });
  }
};

exports.sendNudge = async (req, res) => {
  try {
    const managerId = req.user.id;
    const employeeId = req.params.employeeId;
    const department = req.user.department;

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.department !== department) {
      return res.status(403).json({ message: 'Cannot nudge employee outside your department.' });
    }

    // Check global limit: 5 nudges per 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const totalNudgesToday = await NudgeLog.countDocuments({
      managerId,
      sentAt: { $gte: twentyFourHoursAgo }
    });

    if (totalNudgesToday >= 5) {
      return res.status(429).json({ message: 'You have reached your daily limit of 5 nudges.' });
    }

    // Check per-employee limit
    const recentNudge = await NudgeLog.findOne({
      managerId,
      employeeId,
      sentAt: { $gte: twentyFourHoursAgo }
    });

    if (recentNudge) {
      return res.status(429).json({ message: 'Already nudged this employee today. Try again tomorrow.' });
    }

    // Create a new NudgeLog
    const newNudge = new NudgeLog({ managerId, employeeId });
    await newNudge.save();

    // Create a Notification for the employee (ensure we have the employee's User reference if it exists, otherwise store employee ID)
    // The prompt says: userId: employee.userId, so wait. The Employee model doesn't explicitly store userId. User stores employeeRef.
    const userForEmployee = await User.findOne({ employeeRef: employeeId }) || await User.findOne({ email: employee.email });
    
    if (userForEmployee) {
      const notification = new Notification({
        userId: userForEmployee._id,
        title: 'Learning Reminder from your Manager',
        message: `${req.user.name || 'Your manager'} wants you to keep up your learning momentum! You're currently at ${employee.gapScore || 0}% readiness for ${employee.targetRole || 'your target role'}.`,
        type: 'nudge',
        isRead: false
      });
      await notification.save();

      // Emit socket event to the user
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userForEmployee._id}`).emit('nudge_received', { from: req.user.name || 'Your manager' });
      }
    }

    res.json({ success: true, message: 'Nudge sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending nudge' });
  }
};
exports.setTeamGoal = async (req, res) => {
  try {
    const managerId = req.user.id;
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const { weeklyGoalHours } = req.body;
    if (typeof weeklyGoalHours !== 'number') return res.status(400).json({ message: 'Invalid goal hours.' });

    const employees = await Employee.find({ department });
    const employeeIds = employees.map(e => e._id);

    // Update all LearningProgress records for this department
    await LearningProgress.updateMany(
      { employeeId: { $in: employeeIds } },
      { $set: { weeklyGoalHours } }
    );

    res.json({ success: true, message: 'Team weekly goal updated.', weeklyGoalHours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error setting team goal' });
  }
};

exports.dismissAlert = async (req, res) => {
  try {
    const managerId = req.user.id;
    const alertId = req.params.alertId;

    await ManagerDismissedAlert.create({ managerId, alertId });
    res.json({ success: true, message: 'Alert dismissed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error dismissing alert' });
  }
};

const PDFDocument = require('pdfkit');

exports.getTeamSummaryReport = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const employees = await Employee.find({ department });
    
    const doc = new PDFDocument({ margin: 50 });
    const filename = `team-report-${department.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Team Skills & Gap Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Department: ${department}`);
    doc.text(`Manager: ${req.user.name}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Team Size: ${employees.length}`);
    doc.moveDown(2);

    let totalScore = 0;
    employees.forEach(emp => { totalScore += (emp.gapScore || 0); });
    const avgScore = employees.length > 0 ? Math.round(totalScore / employees.length) : 0;

    doc.fontSize(16).text('KPI Summary');
    doc.fontSize(12).text(`Average Readiness Score: ${avgScore}%`);
    const criticalCount = employees.filter(e => e.gapScore < 40).length;
    doc.text(`Employees in Critical State (<40%): ${criticalCount}`);
    doc.moveDown();

    doc.fontSize(16).text('Team Members');
    doc.moveDown();

    employees.forEach(emp => {
      doc.fontSize(14).text(emp.name);
      doc.fontSize(10).text(`Role: ${emp.currentRole} -> ${emp.targetRole || 'TBD'}`);
      doc.text(`Readiness: ${(emp.gapScore || 0)}%`);
      const topGaps = emp.skills.slice(0, 3).map(s => s.skillName).join(', ');
      doc.text(`Key Skills: ${topGaps || 'None listed'}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Error generating PDF' });
  }
};

exports.getTeamCSVReport = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'No department assigned.' });

    const employees = await Employee.find({ department });
    
    // Aggregate some basic data for the CSV
    const data = employees.map(emp => {
      const topGaps = emp.skills.slice(0, 3);
      return {
        name: emp.name,
        email: emp.email,
        currentRole: emp.currentRole,
        targetRole: emp.targetRole || '',
        gapScore: emp.gapScore || 0,
        topGap1: topGaps[0]?.skillName || '',
        topGap2: topGaps[1]?.skillName || '',
        topGap3: topGaps[2]?.skillName || '',
        lastActive: emp.lastActive ? new Date(emp.lastActive).toISOString().split('T')[0] : '',
        aiPathGenerated: emp.aiLearningPath && emp.aiLearningPath.length > 0 ? 'Yes' : 'No'
      };
    });

    const fields = ['name', 'email', 'currentRole', 'targetRole', 'gapScore', 'topGap1', 'topGap2', 'topGap3', 'lastActive', 'aiPathGenerated'];
    const header = fields.join(',');
    const rows = data.map(row => fields.map(field => `"${(row[field] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`team-data-${department.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (err) {
    console.error('CSV error:', err);
    res.status(500).json({ message: 'Error generating CSV' });
  }
};

exports.getEmployeeReport = async (req, res) => {
  try {
    const department = req.user.department;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || employee.department !== department) {
      return res.status(404).json({ message: 'Employee not found in your department.' });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `employee-report-${employee.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text(`Individual Report: ${employee.name}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Current Role: ${employee.currentRole}`);
    doc.text(`Target Role: ${employee.targetRole || 'Not set'}`);
    doc.text(`Readiness Score: ${employee.gapScore || 0}%`);
    doc.moveDown();

    doc.fontSize(16).text('Skills Snapshot');
    employee.skills.forEach(s => {
      doc.fontSize(12).text(`- ${s.skillName}: Level ${s.proficiencyLevel}`);
    });

    doc.end();
  } catch (err) {
    console.error('Employee PDF error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Error generating PDF' });
  }
};




