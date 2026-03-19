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
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

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

    // Helper functions for aesthetics
    const drawHeader = (title) => {
      doc.rect(0, 0, doc.page.width, 80).fill('#1e1e2f');
      doc.fillColor('#ffffff').fontSize(24).text(title, 50, 30);
      doc.fontSize(10).fillColor('#94a3b8').text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 200, 40, { align: 'right', width: 130 });
      doc.y = 100;
      doc.fillColor('#333333');
    };

    const drawCard = (x, y, w, h, title, value, color) => {
      doc.rect(x, y, w, h).fill('#f8fafc').stroke('#e2e8f0');
      doc.rect(x, y, 4, h).fill(color);
      doc.fillColor('#64748b').fontSize(10).text(title, x + 15, y + 15);
      doc.fillColor('#0f172a').fontSize(20).text(value, x + 15, y + 35);
    };

    // Cover Page / KPI Summary
    drawHeader('Company Skills Report');

    doc.fontSize(18).fillColor('#0f172a').text('KPI Summary', 50, 100);
    doc.moveDown(1);

    const w = 220;
    const h = 70;
    let y = doc.y;

    drawCard(50, y, w, h, 'Total Employees', String(totalEmployees), '#6366f1');
    drawCard(290, y, w, h, 'Avg Readiness Score', `${avgScore}%`, '#10b981');
    y += 90;
    drawCard(50, y, w, h, 'Critical Gaps (< 40%)', String(criticalCount), '#ef4444');
    drawCard(290, y, w, h, 'Active AI Learning Paths', String(withPaths), '#8b5cf6');
    y += 90;
    drawCard(50, y, w, h, 'Learning Path Adoption', `${Math.round((withPaths / Math.max(totalEmployees, 1)) * 100)}%`, '#f59e0b');

    // Department Breakdown
    doc.addPage();
    drawHeader('Department Breakdown');
    doc.fontSize(18).fillColor('#0f172a').text('Average Score by Department', 50, 100);
    doc.moveDown(1);
    
    const deptMap = {};
    employees.forEach((e) => {
      const dept = e.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { count: 0, totalScore: 0 };
      deptMap[dept].count++;
      deptMap[dept].totalScore += e.gapScore || 0;
    });

    let currentY = doc.y;
    Object.entries(deptMap).forEach(([dept, data], i) => {
      if (currentY > 700) { doc.addPage(); drawHeader('Department Breakdown (Cont.)'); currentY = Math.max(doc.y, 100); }
      const avg = Math.round(data.totalScore / data.count);
      doc.rect(50, currentY, doc.page.width - 100, 40).fill(i % 2 === 0 ? '#f1f5f9' : '#ffffff');
      doc.fillColor('#334155').fontSize(12).text(dept, 65, currentY + 14);
      doc.fillColor('#6366f1').fontSize(12).text(`${avg}%`, 0, currentY + 14, { align: 'right', width: doc.page.width - 65 });
      currentY += 40;
    });

    // Employee List
    doc.addPage();
    drawHeader('Employee Readiness List');
    doc.fontSize(14).fillColor('#64748b').text('Showing employees ranked by readiness score (lowest first)', 50, 100);
    doc.moveDown(1);

    currentY = doc.y;
    // Header row
    doc.rect(50, currentY, doc.page.width - 100, 30).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(10).text('Name', 60, currentY + 10);
    doc.text('Department', 200, currentY + 10);
    doc.text('Target Role', 350, currentY + 10);
    doc.text('Score', 500, currentY + 10);
    currentY += 30;

    employees.sort((a, b) => (a.gapScore || 0) - (b.gapScore || 0)); // lowest score first
    employees.slice(0, 40).forEach((emp, i) => {
      if (currentY > 750) { 
        doc.addPage(); 
        drawHeader('Employee Readiness List (Cont.)'); 
        currentY = doc.y;
        doc.rect(50, currentY, doc.page.width - 100, 30).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(10).text('Name', 60, currentY + 10);
        doc.text('Department', 200, currentY + 10);
        doc.text('Target Role', 350, currentY + 10);
        doc.text('Score', 500, currentY + 10);
        currentY += 30;
      }
      doc.rect(50, currentY, doc.page.width - 100, 30).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff');
      doc.fillColor('#334155').fontSize(10).text(emp.name, 60, currentY + 10);
      doc.text(emp.department, 200, currentY + 10);
      doc.text(emp.targetRole || 'N/A', 350, currentY + 10);
      const score = emp.gapScore || 0;
      doc.fillColor(score < 40 ? '#ef4444' : score >= 70 ? '#10b981' : '#f59e0b').text(`${score}%`, 500, currentY + 10);
      currentY += 30;
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

// GET /api/export/analytics/pdf
const exportAnalyticsPDF = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const employees = await Employee.find().select('skills targetRole department gapScore').lean();
    
    // Aggregations
    const avgProgress = employees.length ? Math.round(employees.reduce((s, e) => s + (e.gapScore || 0), 0) / employees.length) : 0;
    const skillGapMap = {};
    const roleMap = {};
    const deptMap = {};

    employees.forEach((emp) => {
      (emp.skills || []).forEach((s) => {
        if (s.proficiencyLevel < 3) skillGapMap[s.skillName] = (skillGapMap[s.skillName] || 0) + 1;
      });
      if (emp.targetRole) roleMap[emp.targetRole] = (roleMap[emp.targetRole] || 0) + 1;
      if (emp.department) deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    });

    const topSkillGaps = Object.entries(skillGapMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const roleDistribution = Object.entries(roleMap).sort((a, b) => b[1] - a[1]);
    const departmentBreakdown = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="platform-analytics-${date}.pdf"`);
    doc.pipe(res);

    const drawHeader = (title) => {
      doc.rect(0, 0, doc.page.width, 80).fill('#0f172a'); // Very dark blue
      doc.fillColor('#ffffff').fontSize(24).text(title, 50, 30);
      doc.fontSize(10).fillColor('#64748b').text(`Exported: ${new Date().toLocaleDateString()}`, doc.page.width - 200, 40, { align: 'right', width: 130 });
      doc.y = 100;
      doc.fillColor('#333333');
    };

    drawHeader('Platform Analytics Report');

    doc.fontSize(18).fillColor('#1e293b').text('Overview Stats', 50, 100);
    doc.moveDown(1);
    
    // Mini KPI cards
    const drawCard = (x, y, w, h, title, value, color) => {
      doc.rect(x, y, w, h).fill('#f8fafc').stroke(color);
      doc.rect(x, y, 4, h).fill(color);
      doc.fillColor('#64748b').fontSize(10).text(title, x + 15, y + 15);
      doc.fillColor('#0f172a').fontSize(20).text(value, x + 15, y + 35);
    };

    drawCard(50, doc.y, 200, 70, 'Tracked Employees', String(totalEmployees), '#3b82f6');
    drawCard(270, doc.y, 200, 70, 'Company Avg Readiness', `${avgProgress}%`, '#10b981');
    doc.y += 100;

    let currentY = doc.y;

    const drawList = (title, dataArr, x, width, valExt=' employees') => {
      doc.fontSize(16).fillColor('#0f172a').text(title, x, currentY);
      let localY = currentY + 30;
      
      dataArr.forEach(([name, val], i) => {
        if (localY > 750) { doc.addPage(); drawHeader(title + ' (Cont.)'); localY = 100; }
        doc.rect(x, localY, width, 25).fill(i % 2 === 0 ? '#f1f5f9' : '#ffffff');
        doc.fillColor('#334155').fontSize(10).text(name, x + 10, localY + 8, { width: width - 50, ellipsis: true });
        doc.fillColor('#6366f1').fontSize(10).text(`${val}${valExt}`, x, localY + 8, { align: 'right', width: width - 6 });
        localY += 25;
      });
      return localY;
    };

    // Split page into two columns for top skill gaps and role distribution
    const col1Y = drawList('Top Skill Gaps', topSkillGaps, 50, 220, ' gaps');
    const col2Y = drawList('Role Distribution', roleDistribution, 300, 220, ' emps');

    currentY = Math.max(col1Y, col2Y) + 40;

    if (currentY > 600) { doc.addPage(); drawHeader('Department Logistics'); currentY = 100; }
    
    drawList('Department Breakdown', departmentBreakdown, 50, 470, '');

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) return res.status(500).json({ message: 'Server error generating analytics report.' });
  }
};

module.exports = { exportEmployeePDF, exportTeamCSV, getAnalytics, exportEmployeesCSV, exportCompanyReportPDF, exportAnalyticsPDF };
