const LearningProgress = require('../models/LearningProgress');
const Employee = require('../models/Employee');

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

module.exports = { getProgress, updateProgress, getTeamProgress };
