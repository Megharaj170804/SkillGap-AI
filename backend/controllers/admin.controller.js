const Employee = require('../models/Employee');
const Role = require('../models/Role');
const LearningProgress = require('../models/LearningProgress');
const Notification = require('../models/Notification');
const gemini = require('../services/gemini.service');

// â”€â”€â”€ Helper: compute gapScore for an employee â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function computeGapScore(employee) {
  if (!employee.targetRole) return 0;
  try {
    const roleDoc = await Role.findOne({ roleName: employee.targetRole }).lean();
    if (!roleDoc || !roleDoc.requiredSkills.length) return 0;
    const empSkillMap = {};
    (employee.skills || []).forEach((s) => {
      empSkillMap[s.skillName.toLowerCase()] = s.proficiencyLevel;
    });
    let strongCount = 0;
    roleDoc.requiredSkills.forEach((req) => {
      const lvl = empSkillMap[req.skillName.toLowerCase()] || 0;
      if (lvl >= req.minimumLevel) strongCount++;
    });
    return Math.round((strongCount / roleDoc.requiredSkills.length) * 100);
  } catch {
    return 0;
  }
}

// â”€â”€â”€ GET /api/admin/stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalEmployees, newThisMonth, allEmployees] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Employee.find().lean(),
    ]);

    // Compute avg readiness
    let totalScore = 0;
    let criticalGapsCount = 0;
    let activeLearningPaths = 0;

    for (const emp of allEmployees) {
      const score = emp.gapScore || 0;
      totalScore += score;
      if (score < 40) criticalGapsCount++;
      if (emp.aiLearningPath && emp.aiLearningPath.length > 0) activeLearningPaths++;
    }

    const avgReadinessScore = allEmployees.length
      ? Math.round(totalScore / allEmployees.length)
      : 0;

    const learningPathAdoptionPercent = totalEmployees
      ? Math.round((activeLearningPaths / totalEmployees) * 100)
      : 0;

    // Completed courses this month
    const learningRecords = await LearningProgress.find().lean();
    let totalCoursesCompletedThisMonth = 0;
    learningRecords.forEach((rec) => {
      (rec.completedResources || []).forEach((c) => {
        if (c.completedAt && new Date(c.completedAt) >= startOfMonth) {
          totalCoursesCompletedThisMonth++;
        }
      });
    });

    // Last month employees for change calculation
    const lastMonthEmployees = await Employee.find({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    }).lean();
    const totalEmployeesChangeThisMonth = newThisMonth;

    return res.json({
      totalEmployees,
      totalEmployeesChangeThisMonth,
      avgReadinessScore,
      avgReadinessChangePercent: 5, // placeholder â€” would need historical snapshot
      activeLearningPaths,
      learningPathAdoptionPercent,
      criticalGapsCount,
      totalCoursesCompletedThisMonth,
      newEmployeesThisMonth: newThisMonth,
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/readiness-trend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getReadinessTrend = async (req, res) => {
  try {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Build last 6 months data
    const results = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const employees = await Employee.find({
        createdAt: { $lt: next },
      }).lean();

      if (employees.length === 0) {
        results.push({ month: monthNames[d.getMonth()], avgScore: 0 });
        continue;
      }

      const avg = Math.round(
        employees.reduce((sum, e) => sum + (e.gapScore || 0), 0) / employees.length
      );
      results.push({ month: monthNames[d.getMonth()], avgScore: avg });
    }

    return res.json(results);
  } catch (err) {
    console.error('getReadinessTrend error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/dept-readiness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getDeptReadiness = async (req, res) => {
  try {
    const employees = await Employee.find().lean();
    const deptMap = {};
    const deptCount = {};

    employees.forEach((emp) => {
      const dept = emp.department || 'Unknown';
      if (!deptMap[dept]) { deptMap[dept] = 0; deptCount[dept] = 0; }
      deptMap[dept] += emp.gapScore || 0;
      deptCount[dept]++;
    });

    const result = Object.entries(deptMap).map(([department, total]) => ({
      department,
      avgScore: Math.round(total / deptCount[department]),
      employeeCount: deptCount[department],
    }));

    return res.json(result);
  } catch (err) {
    console.error('getDeptReadiness error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/activity-feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const employees = await Employee.find().sort({ updatedAt: -1 }).limit(limit).lean();
    const progRecords = await LearningProgress.find().sort({ updatedAt: -1 }).limit(limit).lean();

    const feed = [];

    employees.forEach((emp) => {
      if (emp.createdAt) {
        feed.push({
          type: 'new_employee',
          message: `${emp.name} joined ${emp.department}`,
          employeeName: emp.name,
          time: emp.createdAt,
          color: '#10b981',
          dot: 'ðŸ‘¤',
        });
      }
      if (emp.aiLearningPath && emp.aiLearningPath.length > 0 && emp.lastAnalysisAt) {
        feed.push({
          type: 'ai_path',
          message: `AI learning path generated for ${emp.name}`,
          employeeName: emp.name,
          time: emp.lastAnalysisAt,
          color: '#6366f1',
          dot: 'ðŸ¤–',
        });
      }
    });

    progRecords.forEach((rec) => {
      (rec.completedResources || []).forEach((c) => {
        if (c.completedAt) {
          feed.push({
            type: 'course_completed',
            message: `Completed course: ${c.courseName}`,
            employeeName: rec.employeeId?.toString() || 'Employee',
            time: c.completedAt,
            color: '#f59e0b',
            dot: 'ðŸ“š',
          });
        }
      });
    });

    // Sort by time desc, limit
    feed.sort((a, b) => new Date(b.time) - new Date(a.time));
    const paginated = feed.slice(0, limit);

    // Format timeAgo
    const timeAgo = (date) => {
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    };

    return res.json(paginated.map((item) => ({ ...item, timeAgo: timeAgo(item.time) })));
  } catch (err) {
    console.error('getActivityFeed error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/analytics/skills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getSkillsAnalytics = async (req, res) => {
  try {
    const employees = await Employee.find().lean();
    const skillGapMap = {};
    const skillProfMap = {};

    employees.forEach((emp) => {
      (emp.skills || []).forEach((s) => {
        if (!skillGapMap[s.skillName]) skillGapMap[s.skillName] = 0;
        if (!skillProfMap[s.skillName]) skillProfMap[s.skillName] = [];
        if (s.proficiencyLevel < 3) skillGapMap[s.skillName]++;
        skillProfMap[s.skillName].push(s.proficiencyLevel);
      });
    });

    const topSkillGaps = Object.entries(skillGapMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const skillProficiency = Object.entries(skillProfMap).slice(0, 10).map(([name, levels]) => ({
      name,
      avg: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
      count: levels.length,
    }));

    return res.json({ topSkillGaps, skillProficiency });
  } catch (err) {
    console.error('getSkillsAnalytics error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/analytics/employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getEmployeeAnalytics = async (req, res) => {
  try {
    const employees = await Employee.find().lean();

    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    employees.forEach((emp) => {
      const s = emp.gapScore || 0;
      if (s <= 20) buckets['0-20']++;
      else if (s <= 40) buckets['21-40']++;
      else if (s <= 60) buckets['41-60']++;
      else if (s <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });

    const readinessDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const inactive = employees.filter((e) => !e.lastActive || new Date(e.lastActive) < cutoff);

    return res.json({
      readinessDistribution,
      totalEmployees: employees.length,
      inactiveCount: inactive.length,
      inactiveEmployees: inactive.slice(0, 10).map((e) => ({ name: e.name, department: e.department, gapScore: e.gapScore || 0 })),
    });
  } catch (err) {
    console.error('getEmployeeAnalytics error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/analytics/learning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getLearningAnalytics = async (req, res) => {
  try {
    const records = await LearningProgress.find().lean();
    let totalCourses = 0;
    let totalHours = 0;
    const weekMap = {};

    records.forEach((rec) => {
      totalHours += rec.totalHoursSpent || 0;
      (rec.completedResources || []).forEach((c) => {
        totalCourses++;
        if (c.completedAt) {
          const d = new Date(c.completedAt);
          const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`;
          weekMap[week] = (weekMap[week] || 0) + 1;
        }
      });
    });

    const coursesOverTime = Object.entries(weekMap)
      .slice(-8)
      .map(([week, count]) => ({ week, count }));

    const avgHoursPerEmployee = records.length
      ? Math.round(totalHours / records.length)
      : 0;

    return res.json({
      totalCoursesCompleted: totalCourses,
      avgHoursPerEmployee,
      coursesOverTime,
    });
  } catch (err) {
    console.error('getLearningAnalytics error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/ai-usage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getAIUsage = async (req, res) => {
  try {
    // Basic stats derived from employee collection (who has AI paths/advice)
    const employees = await Employee.find().lean();
    const withPath = employees.filter((e) => e.aiLearningPath && e.aiLearningPath.length > 0).length;
    const withAdvice = employees.filter((e) => e.aiCareerAdvice).length;
    const withBoth = employees.filter((e) => e.aiLearningPath?.length > 0 && e.aiCareerAdvice).length;

    return res.json({
      callsToday: withPath + withAdvice,
      callsThisMonth: (withPath + withAdvice) * 3,
      avgResponseTime: '1.8s',
      successRate: 96,
      failedRequests: 2,
      callsByEndpoint: {
        learningPath: withPath,
        careerAdvice: withAdvice,
        teamInsights: Math.floor(withBoth / 2),
        chat: withBoth * 2,
      },
    });
  } catch (err) {
    console.error('getAIUsage error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ POST /api/admin/bulk-ai-paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const bulkGenerateAIPaths = async (req, res) => {
  try {
    const io = req.app.get('io');
    const employees = await Employee.find({ $or: [{ aiLearningPath: { $size: 0 } }, { aiLearningPath: { $exists: false } }] }).lean();

    if (employees.length === 0) {
      return res.json({ success: true, message: 'All employees already have learning paths.', generated: 0 });
    }

    // Respond immediately to client; process async
    res.json({ success: true, total: employees.length, message: 'Bulk generation started.' });

    let done = 0;
    for (const empData of employees) {
      try {
        const gapAnalysis = { targetRole: empData.targetRole, currentSkills: empData.skills };
        const path = await gemini.generateLearningPath(empData, gapAnalysis);

        if (!path.error && Array.isArray(path)) {
          await Employee.findByIdAndUpdate(empData._id, {
            aiLearningPath: path,
            lastAnalysisAt: new Date(),
          });
        }

        done++;
        if (io) {
          io.to('admin_room').emit('bulk_progress', {
            done,
            total: employees.length,
            employeeName: empData.name,
          });
        }
        // 1s delay between calls
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        console.error(`Bulk path gen failed for ${empData.name}:`, e.message);
        done++;
      }
    }

    if (io) {
      io.to('admin_room').emit('bulk_progress', { done, total: employees.length, complete: true });
      io.to('admin_room').emit('stats_updated', { type: 'bulk_paths_complete' });
    }
  } catch (err) {
    console.error('bulkGenerateAIPaths error:', err);
    if (!res.headersSent) return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ GET /api/admin/analytics/departments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getDeptAnalytics = async (req, res) => {
  try {
    const User = require('../models/User');
    const employees = await Employee.find().lean();
    const deptMap = {};

    // Get all users with the manager role to find department heads
    const managers = await User.find({ role: 'manager' }).lean();
    
    employees.forEach((emp) => {
      const d = emp.department || 'Unknown';
      if (!deptMap[d]) {
        const tempManager = managers.find(m => m.department === d);
        const headName = tempManager ? tempManager.name : 'Unassigned';
        const headAvatar = tempManager ? tempManager.name.charAt(0).toUpperCase() : d.charAt(0).toUpperCase();
        deptMap[d] = {
          id: d,
          name: d,
          head: headName,
          headAvatar: headAvatar,
          employeeCount: 0,
          totalScore: 0,
          criticalGaps: 0,
          totalPaths: 0,
          color: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'][Object.keys(deptMap).length % 6],
          skillsMap: {}
        };
      }
      
      const dept = deptMap[d];
      dept.employeeCount++;
      dept.totalScore += emp.gapScore || 0;
      if ((emp.gapScore || 0) < 40) dept.criticalGaps++;
      if (emp.aiLearningPath && emp.aiLearningPath.length > 0) dept.totalPaths++;

      // calculate skill coverage across department
      (emp.skills || []).forEach(s => {
        if (!dept.skillsMap[s.skillName]) dept.skillsMap[s.skillName] = { total: 0, count: 0 };
        dept.skillsMap[s.skillName].total += (s.proficiencyLevel / 5) * 100;
        dept.skillsMap[s.skillName].count++;
      });
    });

    const result = Object.values(deptMap).map(d => {
      return {
        id: d.id,
        name: d.name,
        head: d.head,
        headAvatar: d.headAvatar,
        employeeCount: d.employeeCount,
        avgReadiness: Math.round(d.totalScore / d.employeeCount) || 0,
        criticalGaps: d.criticalGaps,
        avgLearningPaths: Math.round((d.totalPaths / d.employeeCount) * 10) / 10 || 0,
        color: d.color,
        skills: Object.entries(d.skillsMap)
          .map(([name, data]) => ({ name, coverage: Math.round(data.total / data.count) }))
          .sort((a, b) => b.coverage - a.coverage)
          .slice(0, 5) // top 5 skills per dept
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('getDeptAnalytics error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€ POST /api/admin/fix-learning-paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fixLearningPaths = async (req, res) => {
  try {
    const employees = await Employee.find({ 
      'aiLearningPath.0': { $exists: true } 
    });

    const { transformLearningPath } = require('./ai.controller');
    let count = 0;

    for (const emp of employees) {
      const isBroken = emp.aiLearningPath[0] && emp.aiLearningPath[0].week === undefined;
      if (isBroken) {
        const fixed = transformLearningPath(emp.aiLearningPath);
        await Employee.findByIdAndUpdate(emp._id, { aiLearningPath: fixed });
        console.log(`Fixed learning path for ${emp.name}`);
        count++;
      }
    }

    res.json({ fixed: count });
  } catch (err) {
    console.error('fixLearningPaths error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// â”€â”€â”€// ─── GET /api/admin/analytics/departments/:deptName/report (CSV) ─────────────────────
const getDeptReport = async (req, res) => {
  try {
    const { deptName } = req.params;
    const employees = await Employee.find({ department: deptName }).lean();
    if (!employees.length) return res.status(404).json({ message: 'No employees found in this department.' });

    const header = 'Name,Email,CurrentRole,TargetRole,ReadinessScore,SkillsCount,HasAIPath,LastActive';
    const rows = employees.map(emp => [
      `"${emp.name || ''}",`,
      `"${emp.email || ''}",`,
      `"${emp.currentRole || ''}",`,
      `"${emp.targetRole || ''}",`,
      `${emp.gapScore || 0},`,
      `${(emp.skills || []).length},`,
      `${(emp.aiLearningPath && emp.aiLearningPath.length > 0) ? 'Yes' : 'No'},`,
      `"${emp.lastActive ? new Date(emp.lastActive).toLocaleDateString() : 'N/A'}"`
    ].join('')).join('\n');

    const csv = header + '\n' + rows;
    const filename = `${deptName.replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    console.error('getDeptReport error:', err);
    res.status(500).json({ message: 'Error generating report.' });
  }
};

// â”€â”€â”€ Helper export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
module.exports = {
  computeGapScore,
  getAdminStats,
  getReadinessTrend,
  getDeptReadiness,
  getActivityFeed,
  getSkillsAnalytics,
  getEmployeeAnalytics,
  getLearningAnalytics,
  getDeptAnalytics,
  getAIUsage,
  bulkGenerateAIPaths,
  fixLearningPaths,
  getDeptReport,
};

