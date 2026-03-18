const Employee = require('../models/Employee');
const Role = require('../models/Role');
const LearningProgress = require('../models/LearningProgress');

// GET /api/export/employee/:id/pdf
const exportEmployeePDF = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    const safeName = (employee.name || 'employee').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_report.pdf"`);
    doc.pipe(res);

    // Cover
    doc.fontSize(26).fillColor('#6366f1').text('Skill Gap Report', { align: 'center' });
    doc.fontSize(13).fillColor('#555').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#6366f1').stroke();
    doc.moveDown();

    // Profile
    doc.fontSize(16).fillColor('#1a1a2e').text('Employee Profile');
    doc.fontSize(12).fillColor('#333');
    doc.text(`Name: ${employee.name}`);
    doc.text(`Email: ${employee.email || 'N/A'}`);
    doc.text(`Current Role: ${employee.currentRole}`);
    doc.text(`Target Role: ${employee.targetRole || 'Not set'}`);
    doc.text(`Department: ${employee.department}`);
    doc.text(`Readiness Score: ${employee.gapScore || 0}%`);
    doc.moveDown();

    // Skills
    doc.fontSize(16).fillColor('#1a1a2e').text('Current Skills');
    doc.moveDown(0.5);
    (employee.skills || []).forEach((skill) => {
      doc.fontSize(11).fillColor('#333').text(
        `• ${skill.skillName}: Level ${skill.proficiencyLevel}/5 (${skill.yearsOfExperience || 0} yrs exp)`
      );
    });
    doc.moveDown();

    // AI Learning Path
    if (employee.aiLearningPath && employee.aiLearningPath.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#1a1a2e').text('AI-Generated 12-Week Learning Path');
      doc.moveDown(0.5);
      employee.aiLearningPath.slice(0, 12).forEach((week, i) => {
        const title = week.title || week.focusSkill || `Week ${i + 1}`;
        doc.fontSize(13).fillColor('#6366f1').text(`Week ${week.week || i + 1}: ${title}`);
        if (week.expectedOutcome) {
          doc.fontSize(10).fillColor('#555').text(`Goal: ${week.expectedOutcome}`);
        }
        if (week.weeklyGoalHours) {
          doc.fontSize(10).fillColor('#555').text(`Hours this week: ${week.weeklyGoalHours}h`);
        }
        doc.moveDown(0.4);
      });
    }

    // AI Career Advice
    if (employee.aiCareerAdvice && !employee.aiCareerAdvice.error) {
      doc.addPage();
      doc.fontSize(16).fillColor('#1a1a2e').text('AI Career Advice');
      doc.moveDown(0.5);
      const adv = employee.aiCareerAdvice;
      if (adv.uniqueInsight) {
        doc.fontSize(12).fillColor('#333').text(`Insight: ${adv.uniqueInsight}`);
        doc.moveDown(0.5);
      }
      if (adv.motivationalMessage) {
        doc.fontSize(12).fillColor('#555').text(`Message: ${adv.motivationalMessage}`);
      }
    }

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) return res.status(500).json({ message: 'Server error generating PDF.' });
  }
};

// GET /api/export/employees/csv
const exportEmployeesCSV = async (req, res) => {
  try {
    const { dept, filter, search } = req.query;
    let query = {};
    if (dept && dept !== 'All') query.department = dept;
    if (filter === 'critical') query.gapScore = { $lt: 40 };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query).lean();

    const { Parser } = require('json2csv');
    const fields = [
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Department', value: 'department' },
      { label: 'Current Role', value: 'currentRole' },
      { label: 'Target Role', value: 'targetRole' },
      { label: 'Readiness Score', value: 'gapScore' },
      { label: 'Skills Count', value: (row) => (row.skills || []).length },
      { label: 'Skills', value: (row) => (row.skills || []).map((s) => `${s.skillName}:${s.proficiencyLevel}`).join('; ') },
      { label: 'Has AI Path', value: (row) => row.aiLearningPath?.length > 0 ? 'Yes' : 'No' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(employees);

    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="employees-export-${date}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error generating CSV.' });
  }
};

// GET /api/export/company-report/pdf
const exportCompanyReportPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="company-report-${date}.pdf"`);
    doc.pipe(res);

    const employees = await Employee.find().lean();
    const totalEmployees = employees.length;
    const avgScore = totalEmployees
      ? Math.round(employees.reduce((s, e) => s + (e.gapScore || 0), 0) / totalEmployees)
      : 0;
    const criticalCount = employees.filter((e) => (e.gapScore || 0) < 40).length;
    const withPaths = employees.filter((e) => e.aiLearningPath?.length > 0).length;

    // Cover Page
    doc.fontSize(30).fillColor('#6366f1').text('Company Skills Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#555').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.fontSize(14).fillColor('#555').text(`Total Employees: ${totalEmployees}`, { align: 'center' });
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#6366f1').stroke();

    // KPI Summary
    doc.addPage();
    doc.fontSize(20).fillColor('#1a1a2e').text('KPI Summary');
    doc.moveDown();
    const kpis = [
      ['Total Employees', totalEmployees],
      ['Avg Readiness Score', `${avgScore}%`],
      ['Critical Gaps (< 40%)', criticalCount],
      ['Active AI Learning Paths', withPaths],
      ['Learning Path Adoption', `${Math.round((withPaths / Math.max(totalEmployees, 1)) * 100)}%`],
    ];
    kpis.forEach(([label, value]) => {
      doc.fontSize(13).fillColor('#333').text(`${label}: `, { continued: true });
      doc.fillColor('#6366f1').text(String(value));
    });

    // Department Breakdown
    doc.addPage();
    doc.fontSize(20).fillColor('#1a1a2e').text('Department Breakdown');
    doc.moveDown();
    const deptMap = {};
    employees.forEach((e) => {
      const dept = e.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { count: 0, totalScore: 0 };
      deptMap[dept].count++;
      deptMap[dept].totalScore += e.gapScore || 0;
    });
    Object.entries(deptMap).forEach(([dept, data]) => {
      const avg = Math.round(data.totalScore / data.count);
      doc.fontSize(12).fillColor('#333').text(`${dept}: ${data.count} employees, Avg Score: ${avg}%`);
    });

    // Employee List
    doc.addPage();
    doc.fontSize(20).fillColor('#1a1a2e').text('Employee Readiness List');
    doc.moveDown();
    employees.slice(0, 40).forEach((emp) => {
      doc.fontSize(10).fillColor('#333').text(
        `${emp.name} | ${emp.department} | ${emp.currentRole} → ${emp.targetRole || 'N/A'} | Score: ${emp.gapScore || 0}%`
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) return res.status(500).json({ message: 'Server error generating company report.' });
  }
};

// GET /api/export/team/:dept/csv
const exportTeamCSV = async (req, res) => {
  try {
    const { dept } = req.params;
    const employees = await Employee.find({ department: dept }).lean();
    const { Parser } = require('json2csv');
    const fields = ['name', 'currentRole', 'targetRole', 'department'];
    const data = employees.map((e) => ({
      name: e.name,
      currentRole: e.currentRole,
      targetRole: e.targetRole || 'N/A',
      department: e.department,
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

// GET /api/export/analytics
const getAnalytics = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const employees = await Employee.find().select('skills targetRole department gapScore').lean();
    const avgProgress = employees.length
      ? Math.round(employees.reduce((s, e) => s + (e.gapScore || 0), 0) / employees.length)
      : 0;
    const skillGapMap = {};
    employees.forEach((emp) => {
      (emp.skills || []).forEach((s) => {
        if (s.proficiencyLevel < 3) skillGapMap[s.skillName] = (skillGapMap[s.skillName] || 0) + 1;
      });
    });
    const topSkillGaps = Object.entries(skillGapMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    const roleMap = {};
    employees.forEach((e) => { if (e.targetRole) roleMap[e.targetRole] = (roleMap[e.targetRole] || 0) + 1; });
    const roleDistribution = Object.entries(roleMap).map(([name, value]) => ({ name, value }));
    const deptMap = {};
    employees.forEach((e) => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
    const departmentBreakdown = Object.entries(deptMap).map(([dept, count]) => ({ dept, count }));
    return res.json({ totalEmployees, avgProgress, topSkillGaps, roleDistribution, departmentBreakdown });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { exportEmployeePDF, exportTeamCSV, getAnalytics, exportEmployeesCSV, exportCompanyReportPDF };
