const Employee = require('../models/Employee');
const User = require('../models/User');
const gemini = require('../services/gemini.service');
const Notification = require('../models/Notification');

// Helper — check if cached result is still fresh (24h)
const isCacheValid = (lastAnalysisAt) => {
  if (!lastAnalysisAt) return false;
  const diff = Date.now() - new Date(lastAnalysisAt).getTime();
  return diff < 24 * 60 * 60 * 1000; // 24 hours
};

// Helper — create a notification in DB
const createNotification = async (userId, title, message, type) => {
  try {
    if (userId) {
      await Notification.create({ userId, title, message, type });
    }
  } catch (e) {
    console.error('Notification save error:', e.message);
  }
};

// POST /api/ai/learning-path/:employeeId
const generateLearningPath = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { role, id } = req.user;

    // Employee can only access own
    if (role === 'employee') {
      const user = await User.findById(id);
      if (!user?.employeeRef || user.employeeRef.toString() !== employeeId) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Return cached if valid
    if (isCacheValid(employee.lastAnalysisAt) && employee.aiLearningPath?.length > 0) {
      return res.json({ learningPath: employee.aiLearningPath, cached: true });
    }

    // Build gap context
    const gapAnalysis = {
      targetRole: employee.targetRole,
      currentSkills: employee.skills,
    };

    const learningPath = await gemini.generateLearningPath(employee.toObject(), gapAnalysis);

    if (!learningPath.error) {
      employee.aiLearningPath = Array.isArray(learningPath) ? learningPath : [];
      employee.lastAnalysisAt = new Date();
      await employee.save();

      // Emit real-time event
      const io = req.app.get('io');
      if (io) {
        io.to(`employee_${employeeId}`).emit('learning_path_updated', {
          employeeId,
          message: 'Your AI learning path has been updated!',
        });
      }

      // Notify user
      const empUser = await User.findOne({ employeeRef: employeeId });
      if (empUser) {
        await createNotification(
          empUser._id,
          '🤖 AI Learning Path Ready',
          'Your personalized 12-week learning path has been generated.',
          'ai_ready'
        );
      }
    }

    return res.json({ learningPath, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/ai/career-advice/:employeeId
const generateCareerAdvice = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { role, id } = req.user;

    if (role === 'employee') {
      const user = await User.findById(id);
      if (!user?.employeeRef || user.employeeRef.toString() !== employeeId) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Return cached
    if (isCacheValid(employee.lastAnalysisAt) && employee.aiCareerAdvice) {
      return res.json({ advice: employee.aiCareerAdvice, cached: true });
    }

    const advice = await gemini.generateCareerAdvice(employee.toObject());

    if (!advice.error) {
      employee.aiCareerAdvice = advice;
      await employee.save();
    }

    return res.json({ advice, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/ai/skill-recommendations
const generateSkillRecommendations = async (req, res) => {
  try {
    const { projectDescription } = req.body;
    if (!projectDescription) return res.status(400).json({ message: 'projectDescription is required.' });
    const skills = await gemini.generateSkillRecommendations(projectDescription);
    return res.json({ skills });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/ai/team-insights/:department
const generateTeamInsights = async (req, res) => {
  try {
    const { department } = req.params;
    const employees = await Employee.find({ department });
    if (!employees.length) return res.status(404).json({ message: 'No employees found in department.' });

    const teamSkillsData = employees.map((e) => ({
      name: e.name,
      currentRole: e.currentRole,
      targetRole: e.targetRole,
      skills: e.skills,
    }));

    const insights = await gemini.generateTeamInsights(teamSkillsData);
    return res.json({ department, insights });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { message, employeeId } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required.' });

    let employeeContext = {};
    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (employee) {
        employeeContext = {
          name: employee.name,
          currentRole: employee.currentRole,
          targetRole: employee.targetRole,
          skills: employee.skills.map((s) => `${s.skillName}: Level ${s.proficiencyLevel}`),
        };
      }
    }

    const reply = await gemini.aiChatAssistant(message, employeeContext);
    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  generateLearningPath,
  generateCareerAdvice,
  generateSkillRecommendations,
  generateTeamInsights,
  aiChat,
};
