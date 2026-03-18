const Achievement = require('../models/Achievement');
const Employee = require('../models/Employee');
const User = require('../models/User');
const mongoose = require('mongoose');

const getAchievements = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Fallback if frontend sends "undefined" string due to async state delay
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const allBadges = [
        { id: 'first_skill', title: 'First Skill Added', description: 'Added your first skill to the platform.', icon: '🌱' },
        { id: 'streak_3', title: '3-Day Streak', description: 'Logged study sessions for 3 consecutive days.', icon: '🔥' },
        { id: 'streak_7', title: '7-Day Streak', description: 'Logged study sessions for 7 consecutive days!', icon: '🌟' },
        { id: 'path_generated', title: 'Pathfinder', description: 'Generated your first AI learning path.', icon: '🗺️' },
        { id: 'week_completed', title: 'Consistent Learner', description: 'Completed your first week in the learning path.', icon: '✅' },
        { id: 'chat_expert', title: 'Curious Mind', description: 'Asked 5 questions to the AI Career Advisor.', icon: '💬' },
      ];
      return res.json({ earned: [], allBadges });
    }

    const achievements = await Achievement.find({ employeeId }).sort({ earnedAt: -1 });
    // Also return a list of possible achievements to show "Locked" ones
    const allBadges = [
      { id: 'first_skill', title: 'First Skill Added', description: 'Added your first skill to the platform.', icon: '🌱' },
      { id: 'streak_3', title: '3-Day Streak', description: 'Logged study sessions for 3 consecutive days.', icon: '🔥' },
      { id: 'streak_7', title: '7-Day Streak', description: 'Logged study sessions for 7 consecutive days!', icon: '🌟' },
      { id: 'path_generated', title: 'Pathfinder', description: 'Generated your first AI learning path.', icon: '🗺️' },
      { id: 'week_completed', title: 'Consistent Learner', description: 'Completed your first week in the learning path.', icon: '✅' },
      { id: 'chat_expert', title: 'Curious Mind', description: 'Asked 5 questions to the AI Career Advisor.', icon: '💬' },
    ];
    
    return res.json({ earned: achievements, allBadges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkAchievements = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid employeeId' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Not found' });

    const earned = await Achievement.find({ employeeId });
    const earnedIds = earned.map(a => a.badgeId || a.title);

    const newAchievements = [];

    // Check conditions
    if (employee.skills.length > 0 && !earnedIds.includes('first_skill')) {
      newAchievements.push({ employeeId, title: 'First Skill Added', badgeId: 'first_skill', description: 'Added your first skill to the platform.', icon: '🌱', earnedAt: new Date() });
    }
    
    // Streaks (we just fetch stats or calculate here)
    // Actually streaks are dynamically computed in getEmployeeStats usually.
    // Let's assume passed in request or we compute it if needed.
    // For now we will rely on frontend or manual checks.
    
    if (newAchievements.length > 0) {
      await Achievement.insertMany(newAchievements);
      const io = req.app.get('io');
      if (io) {
        newAchievements.forEach(a => {
          io.to(`employee_${employeeId}`).emit('achievement_unlocked', a);
        });
      }
    }

    return res.json({ unlocked: newAchievements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAchievements, checkAchievements };
