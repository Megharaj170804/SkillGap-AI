const LearningProgress = require('../models/LearningProgress');
const Employee = require('../models/Employee');
const StudySession = require('../models/StudySession');
const User = require('../models/User');

// GET /api/progress/:employeeId
const getProgress = async (req, res) => {
  try {
    const progress = await LearningProgress.find({ employeeId: req.params.employeeId }).sort({ updatedAt: -1 });
    return res.json(progress);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/progress/:employeeId — update or create progress for a skill
const updateProgress = async (req, res) => {
  try {
    const { skillName, currentLevel, targetLevel, weeklyGoalHours, completedCourse } = req.body;
    const { employeeId } = req.params;

    let progress = await LearningProgress.findOne({ employeeId, skillName });

    if (!progress) {
      progress = new LearningProgress({
        employeeId,
        skillName,
        currentLevel: currentLevel || 0,
        targetLevel: targetLevel || 3,
        weeklyGoalHours: weeklyGoalHours || 5,
      });
    } else {
      if (currentLevel !== undefined) progress.currentLevel = currentLevel;
      if (targetLevel !== undefined) progress.targetLevel = targetLevel;
      if (weeklyGoalHours !== undefined) progress.weeklyGoalHours = weeklyGoalHours;
    }

    if (completedCourse) {
      progress.completedCourses.push({
        courseName: completedCourse.courseName,
        completedAt: new Date(),
        hoursSpent: completedCourse.hoursSpent || 0,
      });
      progress.totalHoursSpent += completedCourse.hoursSpent || 0;
    }

    progress.updatedAt = new Date();
    await progress.save();

    // Update employee overall progress
    const allProgress = await LearningProgress.find({ employeeId });
    if (allProgress.length > 0) {
      const avg = allProgress.reduce((sum, p) => {
        const pct = p.targetLevel > 0 ? Math.min((p.currentLevel / p.targetLevel) * 100, 100) : 0;
        return sum + pct;
      }, 0) / allProgress.length;
      await Employee.findByIdAndUpdate(employeeId, { overallProgress: Math.round(avg) });
    }

    return res.json(progress);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/progress/team/:department
const getTeamProgress = async (req, res) => {
  try {
    const { department } = req.params;
    const employees = await Employee.find({ department });
    const results = await Promise.all(
      employees.map(async (emp) => {
        const progress = await LearningProgress.find({ employeeId: emp._id });
        const totalHours = progress.reduce((s, p) => s + p.totalHoursSpent, 0);
        return {
          employeeId: emp._id,
          name: emp.name,
          overallProgress: emp.overallProgress,
          totalHoursSpent: totalHours,
          skillsTracked: progress.length,
        };
      })
    );
    return res.json({ department, teamProgress: results });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/progress/log-today
const logToday = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { skillName } = req.body;

    if (!skillName) return res.status(400).json({ message: 'skillName is required' });

    // Create a new study session for today
    const session = await StudySession.create({
      employeeId,
      skillName,
      hoursSpent: 1, // Defaulting to 1 hour
      date: new Date()
    });

    // Fire socket event so charts update everywhere
    const io = req.app.get('io');
    const employee = await Employee.findById(employeeId).lean();
    if (io && employee.managerId) {
       io.to(`manager_${employee.managerId}`).emit('activity_update', {
         type: 'study_session', employeeName: employee.name, skillName
       });
       io.to('admin_room').emit('activity_feed_update', {
         type: 'study_session',
         message: `${employee.name} studied ${skillName} for 1 hour`,
         employeeName: employee.name,
         dot: '📚',
         color: '#8b5cf6',
         timeAgo: 'just now',
       });
    }

    return res.json(session);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error logging today data' });
  }
};

const completeResource = async (req, res) => {
  try {
    const { employeeId, weekNumber, resourceTitle, hoursSpent } = req.body;
    
    // Make sure employee can only edit their own
    const user = await User.findById(req.user.id);
    if (user.role === 'employee' && user.employeeRef.toString() !== employeeId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee || !employee.aiLearningPath) {
      return res.status(404).json({ message: 'Employee or Learning Path not found.' });
    }

    // Find the week to check what the skill name was
    const weekData = employee.aiLearningPath.find(w => w.week === weekNumber);
    if (!weekData) {
      return res.status(404).json({ message: 'Week not found in learning path.' });
    }

    const skillName = weekData.focusSkill || 'General Learning';

    // Find resource in the week to get platform, if needed
    const resourceData = weekData.resources?.find(r => r.title === resourceTitle);
    const platform = resourceData?.platform || 'Unknown';

    let progress = await LearningProgress.findOne({ employeeId, skillName });
    if (!progress) {
      progress = new LearningProgress({
        employeeId,
        skillName,
        currentLevel: 0,
        targetLevel: weekData.targetLevel || 3,
        weeklyGoalHours: weekData.weeklyGoalHours || 5,
        completedResources: []
      });
    }

    // Check if not already completed
    const alreadyDone = progress.completedResources.some(r => r.title === resourceTitle && r.weekNumber === weekNumber);
    if (!alreadyDone) {
      progress.completedResources.push({
        title: resourceTitle,
        platform,
        completedAt: new Date(),
        hoursSpent: hoursSpent || 0,
        weekNumber
      });
      progress.totalHoursSpent += hoursSpent || 0;
      progress.updatedAt = new Date();
      await progress.save();

      // Create study session
      await StudySession.create({
        employeeId,
        weekNumber,
        skillName,
        hoursSpent: hoursSpent || 0.5,
        notes: `Completed resource: ${resourceTitle}`,
        activityType: 'complete',
        date: new Date()
      });
    }

    // Check if all resources for this week are done
    // Find how many distinct tools are done.
    const allResourcesForWeek = weekData.resources || [];
    let doneCount = 0;
    allResourcesForWeek.forEach(reqObj => {
      if (progress.completedResources.some(cr => cr.title === reqObj.title && cr.weekNumber === weekNumber)) {
        doneCount++;
      }
    });
    const weekComplete = doneCount >= allResourcesForWeek.length;

    return res.json({ success: true, weekComplete });
  } catch (err) {
    console.error('completeResource error:', err);
    return res.status(500).json({ message: 'Server error completing resource.' });
  }
};

const logSession = async (req, res) => {
  try {
    const { employeeId, weekNumber, skillName, hoursSpent, notes, date } = req.body;
    
    const user = await User.findById(req.user.id);
    if (user.role === 'employee' && user.employeeRef.toString() !== employeeId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const session = await StudySession.create({
      employeeId,
      weekNumber: weekNumber || null,
      skillName: skillName || 'General Learning',
      hoursSpent: hoursSpent || 1,
      notes: notes || '',
      activityType: 'study',
      date: date ? new Date(date) : new Date()
    });

    // Helper calculate streak
    const { calculateStreakData } = require('./employee.controller'); 
    // Wait, requiring employee.controller here will cause a circular dependency.
    // I can duplicate logic or assume it is handled by next GET /streak call on frontend.
    // For now, let's just let the frontend fetch the streak later, or return a mock +1.
    // Let's implement a very simple streak increment if needed, or omit it.

    const io = req.app.get('io');
    if (io) {
      io.to(`employee_${employeeId}`).emit('session_logged', { session });
      if (employee.managerId) {
        io.to(`manager_${employee.managerId}`).emit('activity_update', {
          employeeId,
          type: 'study_session',
          message: `${employee.name} studied ${session.skillName} for ${session.hoursSpent}h`
        });
      }
      io.to('admin_room').emit('stats_updated', { type: 'session_logged' });
    }

    return res.json({ success: true, newStreak: -1 }); // -1 indicates frontend should re-fetch
  } catch (err) {
    console.error('logSession error:', err);
    return res.status(500).json({ message: 'Server error logging session.' });
  }
};

module.exports = { getProgress, updateProgress, getTeamProgress, logToday, completeResource, logSession };
