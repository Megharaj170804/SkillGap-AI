const Employee = require('../models/Employee');
const User = require('../models/User');
const Project = require('../models/Project');
const Role = require('../models/Role');
const gemini = require('../services/gemini.service');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const parseGeminiJSON = (rawText) => {
  // Step 1: strip markdown code fences
  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Step 2: extract JSON array content between first [ and last ]
  const startIndex = cleaned.indexOf('[');
  const endIndex = cleaned.lastIndexOf(']');

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('No JSON array found in Gemini response');
  }

  cleaned = cleaned.substring(startIndex, endIndex + 1);

  // Step 3: try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Step 4: attempt cleanup repairs
    try {
      let repaired = cleaned
        .replace(/,\s*([}\]])/g, '$1')         // remove trailing commas before } or ]
        .replace(/([{,])\s*'([^']+)'\s*:/g, '$1"$2":')  // single-quoted keys -> double-quoted
        .replace(/:\s*'([^']*)'/g, ': "$1"')   // single-quoted values -> double-quoted
        .replace(/[\u0000-\u001F]+/g, ' ')      // strip control chars
        .replace(/\/\*.*?\*\//gs, '')           // strip block comments
        .replace(/\/\/[^\n]*/g, '')             // strip line comments
        .replace(/,\s*([}\]])/g, '$1');         // trailing commas again after comment strip
      return JSON.parse(repaired);
    } catch (e2) {
      // Step 5: last resort – extract individual objects and build array
      const objects = [];
      const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let match;
      while ((match = objRegex.exec(cleaned)) !== null) {
        try {
          objects.push(JSON.parse(match[0]));
        } catch (_) {}
      }
      if (objects.length > 0) return objects;
      throw new Error(`JSON parse failed: ${e2.message}`);
    }
  }
};

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
    const { targetRole, skills, hoursPerWeek, focusAreas, learningStyle, weekCount } = req.body;
    const { role, id } = req.user;

    // Employee can only access own
    if (role === 'employee') {
      const user = await User.findById(id);
      if (!user?.employeeRef || user.employeeRef.toString() !== employeeId) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid employee ID format.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Ensure we have current role and target role
    if (!targetRole && !employee.targetRole) {
      return res.status(400).json({ message: 'Target role is required.' });
    }

    // Load role requirements
    let roleRequirements = [];
    const roleDoc = await Role.findOne({ roleName: targetRole || employee.targetRole });
    if (roleDoc) {
      roleRequirements = roleDoc.requiredSkills;
    }

    // Determine gaps
    const missingSkills = [];
    const weakSkills = [];
    const empSkillsArr = skills || employee.skills || [];

    roleRequirements.forEach(reqSkill => {
      const empSkill = empSkillsArr.find(s => s.skillName.toLowerCase() === reqSkill.skillName.toLowerCase());
      if (!empSkill || empSkill.proficiencyLevel === 0) {
        missingSkills.push({ skillName: reqSkill.skillName, minimumLevel: reqSkill.minimumLevel, priority: reqSkill.priority });
      } else if (empSkill.proficiencyLevel < reqSkill.minimumLevel) {
        weakSkills.push({ skillName: reqSkill.skillName, currentLevel: empSkill.proficiencyLevel, minimumLevel: reqSkill.minimumLevel, priority: reqSkill.priority || 'important' });
      }
    });

    const numWeeks = weekCount || 12;
    const skillsText = empSkillsArr.length
      ? empSkillsArr.map(s => `${s.skillName} (level ${s.proficiencyLevel}/5)`).join(', ')
      : 'No specific skills listed';
    const gapsText = [
      ...missingSkills.map(s => `${s.skillName} (missing, need ${s.minimumLevel})`),
      ...weakSkills.map(s => `${s.skillName} (level ${s.currentLevel}, need ${s.minimumLevel})`)
    ].join(', ') || 'General skill improvement';

    const prompt = `You are a career coach AI. Generate a ${numWeeks}-week personalized learning path.

Employee: ${employee.name}, current role: ${employee.currentRole}, target role: ${targetRole || employee.targetRole}
Available: ${hoursPerWeek || 10} hours/week, style: ${learningStyle || 'video'}
Current skills: ${skillsText}
Skill gaps to fix: ${gapsText}

Return ONLY a valid JSON array (no markdown, no explanation, no backticks) of ${numWeeks} week objects.
Each week object must have these exact fields:
- week (number)
- title (string)
- focusSkill (string)
- skillCategory (string: Frontend, Backend, Cloud, Data, or DevOps)
- targetLevel (number 1-5)
- currentLevel (number 0-5)
- weeklyGoalHours (number)
- priority (string: critical, important, or good-to-have)
- overview (string, 1-2 sentences)
- dailyPlan (object with keys monday/tuesday/wednesday/thursday/friday, each with task string and estimatedHours number)
- resources (array of 2-3 objects, each with: type, title, platform, url, estimatedHours, difficulty)
- practiceProject (object with: title, description, estimatedHours, githubSearchQuery)
- weeklyCheckpoint (string)
- keyConceptsCovered (array of strings)
- nextWeekPreview (string)

For resources, use real YouTube URLs like https://www.youtube.com/watch?v=VIDEOID and real course links from freeCodeCamp/MDN/Coursera.
IMPORTANT: Return ONLY the JSON array. Start with [ and end with ]. No other text.`;


    const rawResponse = await gemini.generateCustomLearningPath(prompt);
    
    if (!rawResponse) {
       return res.status(500).json({ message: 'AI generation failed, please try again' });
    }
    
    let parsedPath = [];
    try {
      parsedPath = parseGeminiJSON(rawResponse);
    } catch (e) {
      console.error('Gemini JSON parse error:', e.message);
      console.error('Raw response:', rawResponse);
      return res.status(500).json({ message: 'AI generation failed, please try again' });
    }

    if (!Array.isArray(parsedPath)) {
      return res.status(500).json({ message: 'AI generation failed to return an array' });
    }

    // Ensure statuses
    parsedPath = parsedPath.map((w, idx) => ({
      ...w,
      status: idx === 0 ? 'in_progress' : 'upcoming'
    }));

    employee.aiLearningPath = parsedPath;
    if (targetRole) employee.targetRole = targetRole;
    if (skills && Array.isArray(skills)) {
      employee.skills = skills;
    }
    employee.learningPreferences = {
      hoursPerWeek: hoursPerWeek || 10,
      focusAreas: focusAreas || [],
      learningStyle: learningStyle || 'Video-focused'
    };
    employee.lastAnalysisAt = Date.now();
    await employee.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`employee_${employeeId}`).emit('learning_path_ready', {
         path: parsedPath,
         message: 'Your AI learning path has been updated!'
      });
      if (employee.managerId) {
        io.to(`manager_${employee.managerId}`).emit('activity_update', {
           employeeId,
           message: `${employee.name} generated a new learning path.`
        });
      }
    }

    // Notify user
    const empUser = await User.findOne({ employeeRef: employeeId });
    if (empUser) {
      await createNotification(
        empUser._id,
        '🤖 AI Learning Path Ready',
        'Your personalized learning path has been generated.',
        'ai_ready'
      );
    }

    return res.json({ success: true, path: parsedPath, message: 'Path generated!' });
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

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid employee ID format.' });
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

    const TeamInsightsCache = require('../models/TeamInsightsCache');
    await TeamInsightsCache.findOneAndUpdate(
      { department },
      { insights, generatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ department, insights });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/ai/project-training-plan/:projectId
const generateProjectTrainingPlan = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('assignedEmployees');
    
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.department && req.user.role === 'manager' && project.department !== req.user.department) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const today = new Date();
    const diffMs = new Date(project.deadline) - today;
    const daysUntilDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const projectData = {
      name: project.name,
      description: project.description,
      requiredSkills: project.requiredSkills,
      daysUntilDeadline,
      assignedEmployees: project.assignedEmployees.map(e => ({
        name: e.name,
        currentRole: e.currentRole,
        skills: e.skills
      }))
    };

    const plan = await gemini.generateProjectTrainingPlan(projectData);

    if (!plan.error) {
      project.aiAnalysis = plan;
      await project.save();
    }

    return res.json({ plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { message, employeeId, history = [] } = req.body;
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

    const reply = await gemini.aiChatAssistant(message, employeeContext, history);
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
  generateProjectTrainingPlan,
  aiChat,
};
