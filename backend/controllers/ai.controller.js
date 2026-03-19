const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Project = require('../models/Project');
const Role = require('../models/Role');
const gemini = require('../services/gemini.service');
const Notification = require('../models/Notification');
const AiLog = require('../models/AiLog');
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
    // Step 4: attempt safe cleanup repairs (NO url-breaking regexes)
    try {
      let repaired = cleaned
        .replace(/,\s*([}\]])/g, '$1')         // remove trailing commas before } or ]
        .replace(/[\u0000-\u001F]+/g, ' ');     // strip control chars (newlines, tabs)
      
      // We removed the single-quote and comment-stripping regexes because 
      // they destructively break URLs (https://) and strings containing quotes.
      return JSON.parse(repaired);
    } catch (e2) {
      console.error('Gemini JSON parse failed completely.', e2.message);
      console.error('Raw string snippet:', cleaned.substring(0, 200));
      throw new Error(`JSON parse failed: ${e2.message}`);
    }
  }
};

// Helper â€” check if cached result is still fresh (24h)
const isCacheValid = (lastAnalysisAt) => {
  if (!lastAnalysisAt) return false;
  const diff = Date.now() - new Date(lastAnalysisAt).getTime();
  return diff < 24 * 60 * 60 * 1000; // 24 hours
};

// Helper â€” create a notification in DB
const createNotification = async (userId, title, message, type) => {
  try {
    if (userId) {
      await Notification.create({ userId, title, message, type });
    }
  } catch (e) {
    console.error('Notification save error:', e.message);
  }
};

const isQuotaOrRateError = (error) => {
  if (!error) return false;
  if (error.isQuotaError || error.status === 429) return true;
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('quota') || msg.includes('rate') || msg.includes('resource_exhausted') || msg.includes('429');
};

const fallbackRecommendations = {
  'Node.js': [
    { type: 'video', title: 'Node.js Crash Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', channel: 'Traversy Media', estimatedHours: 1.5, difficulty: 'beginner', isFree: true },
    { type: 'course', title: 'Node.js on freeCodeCamp', platform: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', estimatedHours: 5, difficulty: 'beginner', isFree: true },
  ],
  React: [
    { type: 'video', title: 'React JS Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=b9eMGE7QtTk', channel: 'Dave Gray', estimatedHours: 9, difficulty: 'beginner', isFree: true },
  ],
  AWS: [
    { type: 'video', title: 'AWS Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=ZB5ONbD_SMY', channel: 'freeCodeCamp', estimatedHours: 5, difficulty: 'intermediate', isFree: true },
  ],
  Docker: [
    { type: 'video', title: 'Docker Tutorial for Beginners', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE', channel: 'TechWorld with Nana', estimatedHours: 3, difficulty: 'beginner', isFree: true },
  ],
  Python: [
    { type: 'video', title: 'Python Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', channel: 'Programming with Mosh', estimatedHours: 6, difficulty: 'beginner', isFree: true },
  ],
  MongoDB: [
    { type: 'course', title: 'MongoDB University Free Courses', platform: 'MongoDB', url: 'https://learn.mongodb.com', estimatedHours: 4, difficulty: 'beginner', isFree: true },
  ],
  'System Design': [
    { type: 'video', title: 'System Design for Beginners', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=MbjObHmDbZo', channel: 'ByteByteGo', estimatedHours: 2, difficulty: 'intermediate', isFree: true },
  ],
};

const generateFallbackPath = (employee, roleRequirements, missingSkills, weekCount = 8) => {
  const skillsToPlan = (missingSkills.length ? missingSkills : roleRequirements || []).slice(0, weekCount);
  if (!skillsToPlan.length) {
    skillsToPlan.push({ skillName: 'General Development', minimumLevel: 3, priority: 'important' });
  }

  return skillsToPlan.map((skill, index) => ({
    week: index + 1,
    title: `${skill.skillName} Fundamentals`,
    focusSkill: skill.skillName,
    skillCategory: skill.category || 'General',
    priority: skill.priority || 'important',
    overview: `This week focuses on building ${skill.skillName} from level ${skill.currentLevel || 0} toward level ${skill.minimumLevel || 3}.`,
    weeklyGoalHours: 10,
    dailyPlan: {
      monday: { task: `Introduction to ${skill.skillName} and terminology`, estimatedHours: 2 },
      tuesday: { task: `${skill.skillName} core concepts and syntax`, estimatedHours: 2 },
      wednesday: { task: `Hands-on drills with ${skill.skillName}`, estimatedHours: 2 },
      thursday: { task: `Build a mini project using ${skill.skillName}`, estimatedHours: 2 },
      friday: { task: `Review, refine, and publish outcomes`, estimatedHours: 2 },
    },
    resources: fallbackRecommendations[skill.skillName] || [
      {
        type: 'course',
        title: `Search "${skill.skillName} tutorial" on YouTube`,
        platform: 'YouTube',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill.skillName} tutorial`)}`,
        estimatedHours: 3,
        difficulty: 'beginner',
        isFree: true,
      },
    ],
    practiceProject: {
      title: `Build a ${skill.skillName} Demo Project`,
      description: `Create a small working project demonstrating ${skill.skillName} basics.`,
      estimatedHours: 3,
      githubSearchQuery: `${skill.skillName} beginner project`,
    },
    weeklyCheckpoint: `You should understand ${skill.skillName} basics and finish one mini project.`,
    keyConceptsCovered: [`${skill.skillName} basics`, 'Best practices', 'Hands-on implementation'],
    nextWeekPreview: skillsToPlan[index + 1] ? `Next: ${skillsToPlan[index + 1].skillName}` : 'You have completed all planned focus skills.',
    status: index === 0 ? 'in_progress' : 'upcoming',
  }));
};

const transformLearningPath = (flatArray) => {
  const weeks = []
  let currentWeek = null
  let weekNumber = 0

  // Define week titles based on focus skills
  // (use these if Gemini doesn't provide titles)
  const getWeekTitle = (focusSkill, weekNum) => {
    return focusSkill 
      ? `${focusSkill} - Week ${weekNum}` 
      : `Week ${weekNum} Learning`
  }

  flatArray.forEach((item) => {
    // DETECT: Is this a daily plan object?
    const isDailyPlan = item.monday !== undefined || 
                        item.tuesday !== undefined || 
                        item.wednesday !== undefined

    // DETECT: Is this a resource object?
    const isResource = item.type !== undefined && 
                       (item.type === 'video' || 
                        item.type === 'course' || 
                        item.type === 'article' || 
                        item.type === 'documentation')

    // DETECT: Is this a practice project?
    const isProject = !item.type && 
                      item.description !== undefined && 
                      item.githubSearchQuery !== undefined

    // DETECT: Is this a proper week object (has week number)?
    const isWeekObject = item.week !== undefined

    if (isWeekObject) {
      // Already properly structured week object
      currentWeek = {
        week: item.week,
        title: item.title || getWeekTitle(item.focusSkill, item.week),
        focusSkill: item.focusSkill || 'General',
        skillCategory: item.skillCategory || 'General',
        priority: item.priority || 'important',
        overview: item.overview || '',
        weeklyGoalHours: item.weeklyGoalHours || 10,
        dailyPlan: item.dailyPlan || {},
        resources: item.resources || [],
        practiceProject: item.practiceProject || null,
        weeklyCheckpoint: item.weeklyCheckpoint || item.expectedOutcome || '',
        keyConceptsCovered: item.keyConceptsCovered || [],
        nextWeekPreview: item.nextWeekPreview || '',
        status: item.status || 'upcoming',
        completedAt: item.completedAt || null,
        skipped: item.skipped || false
      }
      weeks.push(currentWeek)

    } else if (isDailyPlan) {
      // Start a new week with this daily plan
      weekNumber++
      currentWeek = {
        week: weekNumber,
        title: `Week ${weekNumber} Learning`,
        focusSkill: 'General',
        skillCategory: 'General',
        priority: 'important',
        overview: '',
        weeklyGoalHours: 10,
        dailyPlan: {
          monday: item.monday || null,
          tuesday: item.tuesday || null,
          wednesday: item.wednesday || null,
          thursday: item.thursday || null,
          friday: item.friday || null
        },
        resources: [],
        practiceProject: null,
        weeklyCheckpoint: '',
        keyConceptsCovered: [],
        status: item.status || 'upcoming',
        completedAt: null,
        skipped: false
      }
      weeks.push(currentWeek)

    } else if (isResource && currentWeek) {
      // Add resource to current week
      currentWeek.resources.push({
        type: item.type,
        title: item.title,
        platform: item.platform || 'Online',
        url: item.url || '#',
        estimatedHours: item.estimatedHours || 1,
        difficulty: item.difficulty || 'intermediate',
        isFree: item.isFree !== undefined ? item.isFree : true,
        channel: item.channel || null,
        completed: item.completed || false
      })

    } else if (isProject && currentWeek) {
      // Add practice project to current week
      currentWeek.practiceProject = {
        title: item.title || 'Practice Project',
        description: item.description || '',
        estimatedHours: item.estimatedHours || 2,
        githubSearchQuery: item.githubSearchQuery || ''
      }

    } else if (currentWeek && item.weeklyCheckpoint) {
      currentWeek.weeklyCheckpoint = item.weeklyCheckpoint

    } else if (currentWeek && item.keyConceptsCovered) {
      currentWeek.keyConceptsCovered = item.keyConceptsCovered
    }
  })

  // Post-process: infer better week titles from resources if title is generic
  weeks.forEach((week, index) => {
    if (week.title === `Week ${week.week} Learning` && week.resources.length > 0) {
      // Try to get skill from first resource title
      const firstResource = week.resources[0]
      if (firstResource.title) {
        // Extract skill name from resource title
        const skillHints = ['Node.js', 'Express', 'React', 'Python', 'Docker', 
                           'AWS', 'MongoDB', 'REST API', 'TypeScript', 'PostgreSQL',
                           'System Design', 'Git', 'Linux', 'CSS', 'JavaScript']
        const found = skillHints.find(skill => 
          firstResource.title.toLowerCase().includes(skill.toLowerCase())
        )
        if (found) {
          week.title = `${found} Fundamentals`
          week.focusSkill = found
        }
      }
    }
  })

  // Ensure statuses are correct:
  // First non-completed = in_progress, rest = upcoming
  let foundInProgress = false
  weeks.forEach(week => {
    if (week.status === 'completed') return
    if (!foundInProgress) {
      week.status = 'in_progress'
      foundInProgress = true
    } else {
      week.status = 'upcoming'
    }
  })

  return weeks
}

// POST /api/ai/learning-path/:employeeId
const generateLearningPath = async (req, res) => {
  let rawResponse;
  let employee;
  let roleRequirements = [];
  let missingSkills = [];
  let numWeeks = 8;
  try {
    const { employeeId } = req.params;
    const {
      targetRole,
      skills,
      hoursPerWeek,
      focusAreas,
      learningStyle,
      weekCount,
      forceRegenerate,
    } = req.body || {};
    const role = req.user?.role || 'employee';
    const id = req.user?.id;

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

    employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Cache-first response to avoid unnecessary Gemini calls.
    if (
      !forceRegenerate &&
      employee.aiLearningPath &&
      employee.aiLearningPath.length > 0 &&
      isCacheValid(employee.lastAnalysisAt)
    ) {
      return res.json({
        success: true,
        path: transformLearningPath(employee.aiLearningPath),
        cached: true,
        message: 'Loaded from cache',
      });
    }

    // Ensure we have current role and target role
    if (!targetRole && !employee.targetRole) {
      return res.status(400).json({ message: 'Target role is required.' });
    }

    // Load role requirements
    const roleDoc = await Role.findOne({ roleName: targetRole || employee.targetRole });
    if (roleDoc) {
      roleRequirements = roleDoc.requiredSkills;
    }

    // Determine gaps
    missingSkills = [];
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

    numWeeks = weekCount || 8;

    // Hard cap: max 3 successful learning-path generations per user per day.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aiCallsToday = await AiLog.countDocuments({
      userId: id,
      endpoint: 'learning-path',
      timestamp: { $gte: todayStart },
      success: true,
    });

    if (aiCallsToday >= 3) {
      return res.status(429).json({
        message: 'Daily AI generation limit reached (3/day). Try again tomorrow.',
        retryAfter: 'tomorrow',
        quotaError: true,
        cachedPath: employee.aiLearningPath?.length ? transformLearningPath(employee.aiLearningPath) : null,
      });
    }

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
IMPORTANT: Return ONLY the JSON array. Start with [ and end with ]. No other text.

CRITICAL JSON STRUCTURE REQUIREMENT:
Return each week as a COMPLETE self-contained object.
Daily plan, resources, and practice project must be NESTED inside 
each week object â€” NOT as separate array items.

Each week object MUST have ALL these fields:
- week (number)
- title (descriptive string, not just "Week 1 Learning")  
- focusSkill (exact skill name being learned)
- skillCategory (Frontend/Backend/Cloud/Data/DevOps)
- priority (critical/important/good-to-have)
- overview (2 sentence description)
- weeklyGoalHours (number)
- dailyPlan (object with monday through friday keys)
- resources (ARRAY of resource objects nested here, not separate)
- practiceProject (object nested here, not separate)
- weeklyCheckpoint (string)
- keyConceptsCovered (array of strings)
- nextWeekPreview (string)

Example of ONE correct week object:
{
  "week": 1,
  "title": "Node.js & Express Foundations",
  "focusSkill": "Node.js",
  "skillCategory": "Backend",
  "priority": "critical",
  "overview": "This week introduces Node.js runtime...",
  "weeklyGoalHours": 10,
  "dailyPlan": {
    "monday": { "task": "Watch Node.js intro video", "estimatedHours": 2 },
    "tuesday": { "task": "Build Hello World server", "estimatedHours": 2 },
    "wednesday": { "task": "Learn Express routing", "estimatedHours": 2 },
    "thursday": { "task": "Add middleware", "estimatedHours": 2 },
    "friday": { "task": "Review and push to GitHub", "estimatedHours": 2 }
  },
  "resources": [
    {
      "type": "video",
      "title": "Node.js Crash Course",
      "platform": "YouTube",
      "url": "https://www.youtube.com/watch?v=fBNz5xF-Kx4",
      "channel": "Traversy Media",
      "estimatedHours": 1.5,
      "difficulty": "beginner",
      "isFree": true
    }
  ],
  "practiceProject": {
    "title": "Simple Express REST Server",
    "description": "Build a basic REST API with 3 routes",
    "estimatedHours": 2,
    "githubSearchQuery": "express js beginner rest api"
  },
  "weeklyCheckpoint": "You can build a basic REST API with Express",
  "keyConceptsCovered": ["Node modules", "Express routing", "Middleware"],
  "nextWeekPreview": "Next week: MongoDB database integration"
}`;
    rawResponse = await gemini.generateCustomLearningPath(prompt);
    
    if (!rawResponse || typeof rawResponse !== 'string') {
       return res.status(500).json({ message: 'AI generation failed, please try again' });
    }
    
    let parsedPath = [];
    try {
      parsedPath = parseGeminiJSON(rawResponse);
    } catch (e) {
      console.error('Gemini JSON parse error:', e.message);
      console.error('Raw response:', rawResponse);
      fs.writeFileSync(path.join(__dirname, '..', 'gemini_error.txt'), String(rawResponse || 'No response'));
      return res.status(500).json({ message: 'AI generation failed, please try again' });
    }

    if (!Array.isArray(parsedPath)) {
      return res.status(500).json({ message: 'AI generation failed to return an array' });
    }

    // Transform the parsed path using transformer fallback
    const structuredPath = transformLearningPath(parsedPath)

    employee.aiLearningPath = structuredPath;
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

    await AiLog.create({
      userId: id,
      endpoint: 'learning-path',
      success: true,
      timestamp: new Date(),
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`employee_${employeeId}`).emit('learning_path_ready', {
         path: structuredPath,
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
        'ðŸ¤– AI Learning Path Ready',
        'Your personalized learning path has been generated.',
        'ai_ready'
      );
    }

    return res.json({ success: true, path: structuredPath, message: 'Path generated!', cached: false });
  } catch (err) {
    console.error('generateLearningPath error:', err);

    // Persist a small log for debugging recurring failures
    try {
      const logPayload = {
        at: new Date().toISOString(),
        employeeId: employee?._id?.toString(),
        error: err.stack || err.message || String(err),
        rawSnippet: typeof rawResponse === 'string' ? rawResponse.substring(0, 5000) : rawResponse,
      };
      const logFile = path.join(__dirname, '..', 'gemini_catch_error.txt');
      fs.writeFileSync(logFile, JSON.stringify(logPayload, null, 2));
    } catch (logErr) {
      console.error('Failed to write gemini_catch_error.txt:', logErr.message);
    }

    // Return cached path for quota/rate errors when available.
    if (isQuotaOrRateError(err) && employee?.aiLearningPath?.length) {
      return res.status(429).json({
        message: 'AI quota exceeded. Using cached path if available.',
        quotaError: true,
        retryAfter: '60 seconds',
        cachedPath: transformLearningPath(employee.aiLearningPath),
      });
    }

    // If quota is exhausted and no cache exists, return static fallback plan.
    if (isQuotaOrRateError(err) && employee && !employee.aiLearningPath?.length) {
      const fallbackPath = generateFallbackPath(employee, roleRequirements, missingSkills, numWeeks || 8);
      employee.aiLearningPath = fallbackPath;
      employee.lastAnalysisAt = Date.now();
      await employee.save();

      return res.status(200).json({
        success: true,
        path: fallbackPath,
        fallback: true,
        quotaError: true,
        message: 'Generated basic path (AI quota exceeded). Regenerate later for AI-personalized version.',
      });
    }

    // Fall back to previously saved path if available so the UI can still load
    if (employee?.aiLearningPath?.length) {
      const safePath = transformLearningPath(employee.aiLearningPath);
      return res.status(200).json({
        success: false,
        path: safePath,
        message: 'Returned cached learning path because AI generation failed.',
        fallback: true,
      });
    }

    return res.status(500).json({ message: 'Server error.', error: err.message });
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

    if (!insights || insights.error) {
      return res.status(500).json({ message: insights?.error || 'AI failed to generate insights. Please try again.' });
    }

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

    if (plan && !plan.error) {
      project.aiAnalysis = plan;
      await project.save();
    }

    if (!plan || plan.error) {
      return res.status(500).json({ message: plan?.error || 'AI could not generate a training plan. Try again.' });
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
  transformLearningPath,
};

