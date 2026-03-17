const Employee = require('../models/Employee');
const Role = require('../models/Role');
const User = require('../models/User');

// GET /api/export/employee/:id/pdf
const exportEmployeePDF = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${employee.name.replace(/ /g, '_')}_gap_report.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#6366f1').text('Skill Gap Report', { align: 'center' });
    doc.fontSize(12).fillColor('#555').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#6366f1').stroke();
    doc.moveDown();

    // Employee info
    doc.fontSize(16).fillColor('#1a1a2e').text('Employee Profile');
    doc.fontSize(12).fillColor('#333');
    doc.text(`Name: ${employee.name}`);
    doc.text(`Current Role: ${employee.currentRole}`);
    doc.text(`Target Role: ${employee.targetRole || 'Not set'}`);
    doc.text(`Department: ${employee.department}`);
    doc.text(`Overall Progress: ${employee.overallProgress || 0}%`);
    doc.moveDown();

    // Skills
    doc.fontSize(16).fillColor('#1a1a2e').text('Current Skills');
    doc.moveDown(0.5);
    employee.skills.forEach((skill) => {
      doc.fontSize(11).fillColor('#333').text(
        `• ${skill.skillName}: Level ${skill.proficiencyLevel}/5 (${skill.yearsOfExperience || 0} yrs exp)`
      );
    });
    doc.moveDown();

    // AI Learning Path if available
    if (employee.aiLearningPath && employee.aiLearningPath.length > 0) {
      doc.fontSize(16).fillColor('#1a1a2e').text('AI Learning Path (12-Week Plan)');
      doc.moveDown(0.5);
      employee.aiLearningPath.slice(0, 6).forEach((week, i) => {
        doc.fontSize(12).fillColor('#6366f1').text(`Week ${week.weekNumber || i + 1}: ${week.focusSkill || ''}`);
        doc.fontSize(10).fillColor('#555').text(`Activity: ${week.learningActivity || ''}`);
        doc.moveDown(0.3);
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error generating PDF.' });
  }
};

// GET /api/export/team/:dept/csv
const exportTeamCSV = async (req, res) => {
  try {
    const { dept } = req.params;
    const employees = await Employee.find({ department: dept });

    const { Parser } = require('json2csv');
    const fields = ['name', 'currentRole', 'targetRole', 'department', 'overallProgress'];
    const data = employees.map((e) => ({
      name: e.name,
      currentRole: e.currentRole,
      targetRole: e.targetRole || 'N/A',
      department: e.department,
      overallProgress: `${e.overallProgress || 0}%`,
    }));

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dept}_team_skills.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error generating CSV.' });
  }
};

// GET /api/export/analytics — platform-wide analytics
const getAnalytics = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const employees = await Employee.find().select('skills targetRole department overallProgress');

    // Compute avg overall progress
    const avgProgress = employees.length
      ? Math.round(employees.reduce((s, e) => s + (e.overallProgress || 0), 0) / employees.length)
      : 0;

    // Skill gap frequency
    const skillGapMap = {};
    employees.forEach((emp) => {
      emp.skills.forEach((s) => {
        if (s.proficiencyLevel < 3) {
          skillGapMap[s.skillName] = (skillGapMap[s.skillName] || 0) + 1;
        }
      });
    });
    const topSkillGaps = Object.entries(skillGapMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Role distribution
    const roleMap = {};
    employees.forEach((e) => {
      if (e.targetRole) roleMap[e.targetRole] = (roleMap[e.targetRole] || 0) + 1;
    });
    const roleDistribution = Object.entries(roleMap).map(([name, value]) => ({ name, value }));

    // Department breakdown
    const deptMap = {};
    employees.forEach((e) => {
      deptMap[e.department] = (deptMap[e.department] || 0) + 1;
    });
    const departmentBreakdown = Object.entries(deptMap).map(([dept, count]) => ({ dept, count }));

    return res.json({
      totalEmployees,
      avgProgress,
      topSkillGaps,
      roleDistribution,
      departmentBreakdown,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { exportEmployeePDF, exportTeamCSV, getAnalytics };
