const Employee = require('../models/Employee');
const Role = require('../models/Role');
const User = require('../models/User');
const LearningProgress = require('../models/LearningProgress');
const Notification = require('../models/Notification');
const StudySession = require('../models/StudySession');
const { computeGapScore } = require('./admin.controller');

// ─── GET /api/employees ────────────────────────────────────────────────────────
const getAllEmployees = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { page = 1, limit = 10, search = '', dept = '', filter = '' } = req.query;

    let query = {};

    if (role === 'manager') {
      const manager = await User.findById(id).lean();
      if (manager?.department) query.department = manager.department;
    }

    if (dept && dept !== 'All') query.department = dept;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { currentRole: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (filter === 'critical') query.gapScore = { $lt: 40 };
    else if (filter === 'on-track') query.gapScore = { $gte: 70 };
    else if (filter === 'inactive') {
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      query.lastActive = { $lt: cutoff };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [employees, total] = await Promise.all([
      Employee.find(query).skip(skip).limit(parseInt(limit)).lean(),
      Employee.countDocuments(query),
    ]);

    return res.json({
      employees,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/employees/:id ────────────────────────────────────────────────────
const getEmployeeById = async (req, res) => {
  try {
    const { role, id } = req.user;
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (role === 'employee') {
      const user = await User.findById(id).lean();
      if (!user?.employeeRef || user.employeeRef.toString() !== employee._id.toString()) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }
    return res.json(employee);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /api/employees ───────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, department, currentRole, targetRole, skills, managerId, systemRole } = req.body;

    // Email uniqueness
    const existing = await User.findOne({ email: email?.toLowerCase() }).lean();
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    let userId = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashed, role: systemRole || 'employee', department });
      userId = newUser._id;
    }

    const employee = await Employee.create({
      name, email, department, currentRole, targetRole,
      skills: skills || [],
      managerId: managerId || null,
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { employeeRef: employee._id });
    }

    // Compute and save gapScore
    const score = await computeGapScore(employee.toObject());
    await Employee.findByIdAndUpdate(employee._id, { gapScore: score });

    // Socket events
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('stats_updated', { type: 'new_employee' });
      io.to(`dept_${department}`).emit('new_employee_added', { employee: { ...employee.toObject(), gapScore: score } });
      io.to('admin_room').emit('activity_feed_update', {
        type: 'new_employee',
        message: `${name} joined ${department}`,
        employeeName: name,
        dot: '👤',
        color: '#10b981',
        timeAgo: 'just now',
      });
    }

    // Notify admins
    const admins = await User.find({ role: 'admin' }).lean();
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: '👤 New Employee Added',
        message: `${name} has been added to ${department}.`,
        type: 'skill_update',
      });
      if (io) io.to(`user_${admin._id}`).emit('new_notification', {});
    }

    return res.status(201).json({ ...employee.toObject(), gapScore: score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during employee creation.' });
  }
};

// ─── PUT /api/employees/:id ────────────────────────────────────────────────────
const updateEmployee = async (req, res) => {
  try {
    const { systemRole, ...updateData } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date(), lastActive: new Date() },
      { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (systemRole) {
      await User.findOneAndUpdate({ employeeRef: employee._id }, { role: systemRole });
    }

    // Recalculate gapScore
    const newScore = await computeGapScore(employee.toObject());
    await Employee.findByIdAndUpdate(employee._id, { gapScore: newScore });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('stats_updated', { type: 'gap_changed' });
      io.to(`employee_${employee._id}`).emit('your_gap_updated', { newScore });

      if (newScore < 40) {
        io.to('admin_room').emit('critical_alert', { employee: { name: employee.name, _id: employee._id }, score: newScore });

        // Notify admins
        const admins = await User.find({ role: 'admin' }).lean();
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: '⚠️ Critical Gap Alert',
            message: `${employee.name} dropped to critical gap score: ${newScore}%`,
            type: 'gap_alert',
          });
          io.to(`user_${admin._id}`).emit('new_notification', {});
        }
      }
    }

    return res.json({ ...employee.toObject(), gapScore: newScore });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /api/employees/:id ─────────────────────────────────────────────────
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Cascade delete
    await Promise.all([
      User.deleteOne({ employeeRef: employee._id }),
      LearningProgress.deleteMany({ employeeId: employee._id }),
      Notification.deleteMany({ userId: req.params.id }),
    ]);

    const io = req.app.get('io');
    if (io) io.to('admin_room').emit('stats_updated', { type: 'employee_deleted' });

    return res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/check-email ──────────────────────────────────────────────────────
const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'email is required.' });
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    return res.json({ available: !existing });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

const calculateGapAnalysis = async (employeeId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee || !employee.targetRole) return { gapScore: 0, missing: [], weak: [], strong: [], totalRequired: 0 };
  
  const role = await Role.findOne({ roleName: employee.targetRole });
  if (!role) return { gapScore: 0, missing: [], weak: [], strong: [], totalRequired: 0 };

  let strong = [], weak = [], missing = [];
  
  role.requiredSkills.forEach(req => {
    const empSkill = employee.skills.find(s => 
      s.skillName.toLowerCase() === req.skillName.toLowerCase()
    );
    if (!empSkill) {
      missing.push({ ...req, currentLevel: 0 });
    } else if (empSkill.proficiencyLevel < req.minimumLevel) {
      weak.push({ ...req, currentLevel: empSkill.proficiencyLevel });
    } else {
      strong.push({ ...req, currentLevel: empSkill.proficiencyLevel });
    }
  });

  const totalRequired = role.requiredSkills.length;
  const gapScore = totalRequired === 0 ? 0 : Math.round((strong.length / totalRequired) * 100);
  
  await Employee.findByIdAndUpdate(employeeId, { gapScore });
  
  return { gapScore, missing, weak, strong, totalRequired };
};

const calculateStreakData = async (employeeId) => {
  const sessions = await StudySession.find({ employeeId }).sort({ date: -1 }).lean();
  if (!sessions.length) return { currentStreak: 0, longestStreak: 0, lastStudyDate: null };

  let currentStreak = 0;
  let longestStreak = 0;
  let currentCount = 0;

  const distinctDatesArray = [...new Set(sessions.map(s => new Date(s.date).toISOString().split('T')[0]))];
  
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  if (!distinctDatesArray.includes(today) && !distinctDatesArray.includes(yesterday)) {
    currentStreak = 0;
  } else {
    let checkDate = new Date(distinctDatesArray.includes(today) ? today : yesterday);
    while (distinctDatesArray.includes(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  for (let i = 0; i < distinctDatesArray.length; i++) {
    if (i === 0) {
      currentCount = 1;
      longestStreak = 1;
      continue;
    }
    const d1 = new Date(distinctDatesArray[i-1]);
    const d2 = new Date(distinctDatesArray[i]);
    const diff = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      currentCount++;
      if (currentCount > longestStreak) longestStreak = currentCount;
    } else {
      currentCount = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastStudyDate: sessions[0].date
  };
};

const getEmployeeStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    if (!employeeId) return res.status(404).json({ message: 'Employee profile not found.' });

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const gapAnalysis = await calculateGapAnalysis(employeeId);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const sessions = await StudySession.find({
      employeeId,
      date: { $gte: startOfWeek }
    });
    
    const learningHoursThisWeek = sessions.reduce((sum, s) => sum + s.hoursSpent, 0);
    const streakData = await calculateStreakData(employeeId);

    return res.json({
      name: employee.name,
      currentRole: employee.currentRole,
      targetRole: employee.targetRole || null,
      department: employee.department,
      gapScore: gapAnalysis.gapScore,
      totalSkills: employee.skills.length,
      skillGapsCount: gapAnalysis.missing.length + gapAnalysis.weak.length,
      strongSkillsCount: gapAnalysis.strong.length,
      learningHoursThisWeek,
      currentStreak: streakData.currentStreak,
      aiPathGenerated: employee.aiLearningPath && employee.aiLearningPath.length > 0,
      lastMotivationalTip: employee.aiCareerAdvice?.tip || null,
      totalRequiredSkills: gapAnalysis.totalRequired,
      notificationPrefs: employee.notificationPrefs,
      weeklyGoalHours: employee.weeklyGoalHours || 5
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching stats.' });
  }
};

const getWeeklyHours = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const sessions = await StudySession.find({
      employeeId,
      date: { $gte: startOfWeek }
    }).lean();

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [
      { day: "Mon", hours: 0 },
      { day: "Tue", hours: 0 },
      { day: "Wed", hours: 0 },
      { day: "Thu", hours: 0 },
      { day: "Fri", hours: 0 },
      { day: "Sat", hours: 0 },
      { day: "Sun", hours: 0 }
    ];

    sessions.forEach(s => {
      const dayName = days[new Date(s.date).getDay()];
      const weekStat = weekData.find(w => w.day === dayName);
      if (weekStat) weekStat.hours += s.hoursSpent;
    });

    return res.json(weekData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching weekly hours.' });
  }
};

const getTodaysFocus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const employee = await Employee.findById(employeeId).lean();

    if (employee.aiLearningPath && employee.aiLearningPath.length > 0) {
      const currentWeekItem = employee.aiLearningPath.find(w => w.status === 'inProgress') || employee.aiLearningPath.find(w => w.status === 'upcoming') || employee.aiLearningPath[employee.aiLearningPath.length - 1];
      return res.json({ 
        focusSkill: currentWeekItem.focusSkill || "Your Learning Path", 
        reason: "Part of your AI generated learning path this week",
        weekNumber: currentWeekItem.weekNumber || 1,
        topResource: currentWeekItem.resources?.[0]?.name || "Review materials"
      });
    }

    const gapAnalysis = await calculateGapAnalysis(employeeId);
    if (gapAnalysis.missing.length > 0) {
      return res.json({
        focusSkill: gapAnalysis.missing[0].skillName,
        reason: `It's your most critical gap for ${employee.targetRole || 'your target role'}`,
        weekNumber: 0,
        topResource: null
      });
    }

    if (gapAnalysis.weak.length > 0) {
       return res.json({
        focusSkill: gapAnalysis.weak[0].skillName,
        reason: `Needs improvement for ${employee.targetRole || 'your target role'}`,
        weekNumber: 0,
        topResource: null
      });
    }

    return res.json({
      focusSkill: "General Learning",
      reason: "You have no immediate skill gaps",
      weekNumber: 0,
      topResource: null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching todays focus.' });
  }
};

const getStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetId = req.params.id || user.employeeRef.toString();
    
    if (req.user.role === 'employee' && user.employeeRef?.toString() !== targetId.toString()) {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const streakData = await calculateStreakData(targetId);
    return res.json(streakData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching streak.' });
  }
};

const setTargetRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { targetRole } = req.body;

    if (!targetRole) return res.status(400).json({ message: 'Target role is required.' });

    await Employee.findByIdAndUpdate(employeeId, { targetRole });
    await calculateGapAnalysis(employeeId);
    const updatedEmployee = await Employee.findById(employeeId).lean();
    
    const io = req.app.get('io');
    if (io && updatedEmployee.managerId) {
       io.to(`manager_${updatedEmployee.managerId}`).emit('team_stats_updated', {
         employeeId, newGapScore: updatedEmployee.gapScore
       });
    }

    return res.json({ message: 'Target role set successfully.', employee: updatedEmployee });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error setting target role.' });
  }
};

const submitSelfAssessment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { skills } = req.body;

    const employee = await Employee.findById(employeeId);
    
    skills.forEach(submittedSkill => {
      const idx = employee.skills.findIndex(s => s.skillName.toLowerCase() === submittedSkill.skillName.toLowerCase());
      if (idx !== -1) {
        employee.skills[idx].proficiencyLevel = submittedSkill.level;
      } else {
        employee.skills.push({ skillName: submittedSkill.skillName, proficiencyLevel: submittedSkill.level, yearsOfExperience: 0 });
      }
    });

    await employee.save();
    await calculateGapAnalysis(employeeId);
    const newEmp = await Employee.findById(employeeId).lean();

    return res.json(newEmp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error processing self assessment.' });
  }
};

const getMySkills = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const role = employee.targetRole ? await Role.findOne({ roleName: employee.targetRole }).lean() : null;

    let enrichedSkills = [];
    
    employee.skills.forEach(empSkill => {
      const reqSkill = role?.requiredSkills?.find(s => s.skillName.toLowerCase() === empSkill.skillName.toLowerCase());
      const requiredLevel = reqSkill ? reqSkill.minimumLevel : null;
      let gap = 0;
      let status = 'extra';
      
      if (reqSkill) {
        gap = requiredLevel - empSkill.proficiencyLevel;
        status = gap > 0 ? 'weak' : 'strong';
      }

      enrichedSkills.push({
        skillName: empSkill.skillName,
        currentLevel: empSkill.proficiencyLevel,
        requiredLevel,
        gap,
        status,
        category: 'Other',
        yearsOfExperience: empSkill.yearsOfExperience || 0
      });
    });

    if (role) {
      role.requiredSkills.forEach(reqSkill => {
        const hasSkill = employee.skills.some(s => s.skillName.toLowerCase() === reqSkill.skillName.toLowerCase());
        if (!hasSkill) {
          enrichedSkills.push({
            skillName: reqSkill.skillName,
            currentLevel: 0,
            requiredLevel: reqSkill.minimumLevel,
            gap: reqSkill.minimumLevel,
            status: 'missing',
            category: 'Other',
            yearsOfExperience: 0
          });
        }
      });
    }

    return res.json(enrichedSkills);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching skills.' });
  }
};

const addSkill = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { skillName, level, yearsOfExperience, category } = req.body;

    if (!skillName || !level) return res.status(400).json({ message: 'Skill name and level are required.' });

    const employee = await Employee.findById(employeeId);
    
    const existingIndex = employee.skills.findIndex(s => s.skillName.toLowerCase() === skillName.toLowerCase());
    if (existingIndex !== -1) {
       employee.skills[existingIndex].proficiencyLevel = level;
       employee.skills[existingIndex].yearsOfExperience = yearsOfExperience || employee.skills[existingIndex].yearsOfExperience;
    } else {
       employee.skills.push({ skillName, proficiencyLevel: level, yearsOfExperience: yearsOfExperience || 0 });
    }
    await employee.save();

    await calculateGapAnalysis(employeeId);
    const newEmp = await Employee.findById(employeeId).lean();
    
    const io = req.app.get('io');
    if (io && newEmp.managerId) {
       io.to(`manager_${newEmp.managerId}`).emit('activity_update', {
         type: 'skill_updated', employeeName: newEmp.name, skillName
       });
       io.to('admin_room').emit('stats_updated', { type: 'skill_updated' });
    }

    return res.json(newEmp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error adding skill.' });
  }
};

const updateSkill = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { skillName, newLevel } = req.body;

    const employee = await Employee.findById(employeeId);
    const skillIndex = employee.skills.findIndex(s => s.skillName.toLowerCase() === skillName.toLowerCase());
    
    if (skillIndex === -1) return res.status(404).json({ message: 'Skill not found.' });

    employee.skills[skillIndex].proficiencyLevel = newLevel;
    await employee.save();

    await calculateGapAnalysis(employeeId);
    const newEmp = await Employee.findById(employeeId).lean();

    const io = req.app.get('io');
    if (io) {
       io.to(`employee_${employeeId}`).emit('your_gap_updated', { newScore: newEmp.gapScore });
       if (newEmp.managerId) {
         io.to(`manager_${newEmp.managerId}`).emit('team_stats_updated', { employeeId, newGapScore: newEmp.gapScore });
       }
    }

    // Call internal check logic (will add achievement check here later)
    return res.json(newEmp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error updating skill.' });
  }
};

const removeSkill = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { skillName } = req.body;

    const employee = await Employee.findById(employeeId);
    employee.skills = employee.skills.filter(s => s.skillName.toLowerCase() !== skillName.toLowerCase());
    await employee.save();

    await calculateGapAnalysis(employeeId);
    const newEmp = await Employee.findById(employeeId).lean();

    return res.json(newEmp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error removing skill.' });
  }
};

const getLearningPath = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    if (!employeeId) return res.status(404).json({ message: 'Employee profile not linked.' });
    
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    let path = employee.aiLearningPath || [];

    // If path exists but looks like flat array (has items without week number)
    const isFlatArray = path.length > 0 && path[0].week === undefined
    if (isFlatArray) {
      const { transformLearningPath } = require('./ai.controller');
      path = transformLearningPath(path)
      // Re-save the fixed structure
      await Employee.findByIdAndUpdate(employeeId, { aiLearningPath: path })
    }

    const currentWeekIndex = path.findIndex(w => w.status === 'in_progress')
    const completedCount = path.filter(w => w.status === 'completed').length
    const totalWeeks = path.length;

    return res.json({ 
      learningPath: path, 
      currentWeek: currentWeekIndex + 1, 
      completedCount, 
      totalWeeks, 
      targetRole: employee.targetRole
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching learning path.' });
  }
};

const completeLearningWeek = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { weekNumber } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee || !employee.aiLearningPath) return res.status(404).json({ message: 'Not found.' });

    const weekIndex = employee.aiLearningPath.findIndex(w => w.week === weekNumber);
    if (weekIndex !== -1) {
      employee.aiLearningPath[weekIndex].status = 'completed';
      employee.aiLearningPath[weekIndex].completedAt = Date.now();
      
      let nextIndex = weekIndex + 1;
      while(nextIndex < employee.aiLearningPath.length && employee.aiLearningPath[nextIndex].status === 'completed') {
        nextIndex++;
      }
      if (nextIndex < employee.aiLearningPath.length) {
        employee.aiLearningPath[nextIndex].status = 'in_progress';
      }
    }
    
    employee.markModified('aiLearningPath');
    
    // Recalculate overallProgress based on completed weeks
    const completed = employee.aiLearningPath.filter(w => w.status === 'completed').length;
    const total = employee.aiLearningPath.length;
    employee.overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    await employee.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`employee_${employeeId}`).emit('learning_path_ready', {}); // or another event to refresh
      if (employee.managerId) {
        io.to(`manager_${employee.managerId}`).emit('activity_update', {
          employeeId,
          type: 'week_completed',
          message: `${employee.name} completed Week ${weekNumber}!`
        });
      }
      io.to('admin_room').emit('stats_updated', { type: 'progress_increase' });
    }

    return res.json({ learningPath: employee.aiLearningPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error updating learning path.' });
  }
};

const skipLearningWeek = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { weekNumber, reason } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee || !employee.aiLearningPath) return res.status(404).json({ message: 'Not found.' });

    const weekIndex = employee.aiLearningPath.findIndex(w => w.week === weekNumber);
    if (weekIndex !== -1) {
      employee.aiLearningPath[weekIndex].status = 'completed';
      employee.aiLearningPath[weekIndex].completedAt = Date.now();
      employee.aiLearningPath[weekIndex].skipped = true;
      employee.aiLearningPath[weekIndex].skipReason = reason;

      let nextIndex = weekIndex + 1;
      while(nextIndex < employee.aiLearningPath.length && employee.aiLearningPath[nextIndex].status === 'completed') {
        nextIndex++;
      }
      if (nextIndex < employee.aiLearningPath.length) {
        employee.aiLearningPath[nextIndex].status = 'in_progress';
      }
    }
    
    employee.markModified('aiLearningPath');

    const completed = employee.aiLearningPath.filter(w => w.status === 'completed').length;
    const total = employee.aiLearningPath.length;
    employee.overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    await employee.save();

    return res.json({ learningPath: employee.aiLearningPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error skipping learning path week.' });
  }
};

const getSkillHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Auth Check
    const { role, id } = req.user;
    if (role === 'employee') {
      const user = await User.findById(id);
      if (!user?.employeeRef || user.employeeRef.toString() !== employeeId) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }

    const employee = await Employee.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const timeline = await StudySession.find({ employeeId }).sort({ date: -1 }).lean();
    const progressDocs = await LearningProgress.find({ employeeId }).lean();
    
    const completedResources = [];
    progressDocs.forEach(doc => {
      if (doc.completedResources && doc.completedResources.length > 0) {
        doc.completedResources.forEach(res => {
          completedResources.push({
            ...res,
            skillName: doc.skillName
          });
        });
      }
    });
    // Sort completed resources by newest first
    completedResources.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Aggregate weekly hours chart for last 8 weeks
    const weeklyHoursChart = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) - now.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const sum = timeline
        .filter(s => new Date(s.date) >= weekStart && new Date(s.date) <= weekEnd)
        .reduce((acc, curr) => acc + (curr.hoursSpent || 0), 0);
        
      weeklyHoursChart.push({
        week: `Week ${weekStart.getMonth()+1}/${weekStart.getDate()}`,
        hours: sum
      });
    }

    // Dummy skillProgressData (the DB doesn't track historic levels of arbitrary points naturally, 
    // unless you want to infer it from current levels). We will just return the current skills for now 
    // and let frontend handle it.
    const skillProgressData = {};
    employee.skills.forEach(s => {
      skillProgressData[s.skillName] = [{ date: new Date(), level: s.proficiencyLevel }];
    });

    return res.json({
      timeline,
      skillProgressData,
      weeklyHoursChart,
      completedResources
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching skill history.' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const me = await Employee.findById(user.employeeRef);
    if (!me) return res.status(404).json({ message: 'Employee not found.' });

    const employees = await Employee.find({ department: me.department })
      .select('name currentRole profilePicture gapScore overallProgress skills')
      .lean();

    const leaderboard = employees.map(emp => {
      // Calculate a "points" score based on gapScore and overall progress
      const gap = typeof emp.gapScore === 'number' ? emp.gapScore : 100;
      const prog = typeof emp.overallProgress === 'number' ? emp.overallProgress : 0;
      const points = (prog * 10) + ((100 - gap) * 5) + ((emp.skills?.length || 0) * 50);
      return {
        _id: emp._id,
        name: emp.name,
        role: emp.currentRole,
        points: Math.round(points),
        avatar: emp.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`
      };
    }).sort((a, b) => b.points - a.points);

    return res.json({ department: me.department, leaderboard });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching leaderboard.' });
  }
};

const saveProjectAnalysis = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const { title, description, requiredSkills } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (!employee.savedProjectAnalyses) {
      employee.savedProjectAnalyses = [];
    }

    employee.savedProjectAnalyses.push({
      title: title || 'Untitled Project',
      description,
      requiredSkills,
      savedAt: new Date()
    });

    await employee.save();
    return res.json({ savedProjects: employee.savedProjectAnalyses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error saving project analysis.' });
  }
};

const getSavedProjects = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    return res.json({ savedProjects: employee.savedProjectAnalyses || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching saved projects.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { name, currentRole, targetRole, department } = req.body;
    const employee = await Employee.findByIdAndUpdate(user.employeeRef, { name, currentRole, targetRole, department }, { new: true });
    
    // Also update User model for name and department
    await User.findByIdAndUpdate(user._id, { name, department });
    
    // Recalculate gap if targetRole changed
    if (targetRole) {
      await calculateGapAnalysis(user.employeeRef);
    }
    
    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const setWeeklyHours = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { hours } = req.body;
    // Assuming we add weeklyGoalHours to schema or generic settings
    // Since we don't have it formally yet, we could just return success 
    // or add it to Employee schema. 
    // Let's assume Employee schema has or can accept weeklyGoalHours dynamically.
    const employee = await Employee.findByIdAndUpdate(user.employeeRef, { $set: { weeklyGoalHours: hours } }, { new: true });
    res.json({ message: 'Weekly hours updated', hours });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateNotificationPrefs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { emailAlerts, pushNotifications, weeklyDigest } = req.body;
    const employee = await Employee.findByIdAndUpdate(user.employeeRef, { 
      $set: { notificationPrefs: { emailAlerts, pushNotifications, weeklyDigest } } 
    }, { new: true });
    res.json({ message: 'Preferences updated', prefs: employee.notificationPrefs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const clearLearningPath = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employee = await Employee.findByIdAndUpdate(user.employeeRef, { aiLearningPath: [] }, { new: true });
    res.json({ message: 'Learning path cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCertificates = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const employeeId = user.employeeRef;
    
    if (!employeeId) {
      return res.status(404).json({ message: 'Employee profile not linked.' });
    }

    const Certificate = require('../models/Certificate');
    const certificates = await Certificate.find({ employeeId }).sort({ issuedAt: -1 }).lean();

    return res.json(certificates);
  } catch (err) {
    console.error('getCertificates error:', err);
    return res.status(500).json({ message: 'Server error fetching certificates.' });
  }
};

module.exports = { 
  getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, checkEmail,
  getEmployeeStats, getWeeklyHours, getTodaysFocus, getStreak, setTargetRole,
  getMySkills, addSkill, updateSkill, removeSkill, submitSelfAssessment,
  getLearningPath, completeLearningWeek, skipLearningWeek, getSkillHistory, getLeaderboard,
  saveProjectAnalysis, getSavedProjects,
  updateProfile, setWeeklyHours, updateNotificationPrefs, clearLearningPath,
  calculateGapAnalysis, getCertificates
};
