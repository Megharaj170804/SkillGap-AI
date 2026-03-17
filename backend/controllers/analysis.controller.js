const Employee = require('../models/Employee');
const Role = require('../models/Role');
const User = require('../models/User');

const recommendations = {
  'Node.js':       { courses: ['Node.js Full Course - FreeCodeCamp', 'The Odin Project'], estimatedWeeks: 4 },
  'AWS':           { courses: ['AWS Cloud Practitioner - AWS Training', 'A Cloud Guru'], estimatedWeeks: 6 },
  'System Design': { courses: ['System Design Primer - GitHub', 'Grokking System Design'], estimatedWeeks: 5 },
  'Docker':        { courses: ['Docker for Beginners - TechWorld with Nana'], estimatedWeeks: 2 },
  'TensorFlow':    { courses: ['TensorFlow Developer Certificate - Coursera'], estimatedWeeks: 8 },
  'Scikit-learn':  { courses: ['ML with Python - FreeCodeCamp'], estimatedWeeks: 4 },
  'MongoDB':       { courses: ['MongoDB University Free Courses'], estimatedWeeks: 3 },
  'REST APIs':     { courses: ['REST API with Node.js - YouTube'], estimatedWeeks: 2 },
  'PostgreSQL':    { courses: ['PostgreSQL Tutorial - freeCodeCamp'], estimatedWeeks: 3 },
  'Deep Learning': { courses: ['Deep Learning Specialization - Coursera (Andrew Ng)'], estimatedWeeks: 10 },
  'MLOps':         { courses: ['MLOps Zoomcamp - DataTalks.Club (Free)'], estimatedWeeks: 6 },
  'React':         { courses: ['React Official Docs', 'Full React Course - FreeCodeCamp'], estimatedWeeks: 4 },
  'Python':        { courses: ['Python for Everybody - Coursera', 'FreeCodeCamp Python'], estimatedWeeks: 4 },
  'JavaScript':    { courses: ['JavaScript.info', 'FreeCodeCamp JavaScript'], estimatedWeeks: 4 },
};

const analyzeEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { role, id } = req.user;

    // Employee access control: only own profile
    if (role === 'employee') {
      const user = await User.findById(id);
      if (!user || !user.employeeRef || user.employeeRef.toString() !== employeeId) {
        return res.status(403).json({ message: 'Forbidden. You can only view your own analysis.' });
      }
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (!employee.targetRole) {
      return res.status(400).json({ message: 'Employee has no target role defined.' });
    }

    const roleDoc = await Role.findOne({ roleName: employee.targetRole });
    if (!roleDoc) {
      return res.status(404).json({ message: `Target role "${employee.targetRole}" not found in skills matrix.` });
    }

    const employeeSkillMap = {};
    employee.skills.forEach((s) => {
      employeeSkillMap[s.skillName.toLowerCase()] = s;
    });

    const missingSkills = [];
    const weakSkills = [];
    const strongSkills = [];

    roleDoc.requiredSkills.forEach((req) => {
      const empSkill = employeeSkillMap[req.skillName.toLowerCase()];
      if (!empSkill) {
        missingSkills.push({
          skillName: req.skillName,
          requiredLevel: req.minimumLevel,
          currentLevel: 0,
          priority: req.priority,
          recommendations: recommendations[req.skillName] || { courses: [], estimatedWeeks: 0 },
        });
      } else if (empSkill.proficiencyLevel < req.minimumLevel) {
        weakSkills.push({
          skillName: req.skillName,
          requiredLevel: req.minimumLevel,
          currentLevel: empSkill.proficiencyLevel,
          priority: req.priority,
          recommendations: recommendations[req.skillName] || { courses: [], estimatedWeeks: 0 },
        });
      } else {
        strongSkills.push({
          skillName: req.skillName,
          requiredLevel: req.minimumLevel,
          currentLevel: empSkill.proficiencyLevel,
          priority: req.priority,
        });
      }
    });

    const totalRequired = roleDoc.requiredSkills.length;
    const gapScore = totalRequired > 0 ? Math.round((strongSkills.length / totalRequired) * 100) : 0;

    // Sort by priority
    const priorityOrder = { critical: 1, important: 2, 'good-to-have': 3 };
    const sortByPriority = (a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    missingSkills.sort(sortByPriority);
    weakSkills.sort(sortByPriority);

    return res.status(200).json({
      employeeId: employee._id,
      employeeName: employee.name,
      currentRole: employee.currentRole,
      targetRole: employee.targetRole,
      gapScore,
      totalRequired,
      strongSkills,
      weakSkills,
      missingSkills,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error during analysis.' });
  }
};

const analyzeTeam = async (req, res) => {
  try {
    const { department } = req.params;
    const employees = await Employee.find({ department });

    const teamAnalysis = await Promise.all(
      employees.map(async (emp) => {
        if (!emp.targetRole) return { employeeId: emp._id, name: emp.name, gapScore: null, error: 'No targetRole' };

        const roleDoc = await Role.findOne({ roleName: emp.targetRole });
        if (!roleDoc) return { employeeId: emp._id, name: emp.name, gapScore: null, error: 'Role not found' };

        const empSkillMap = {};
        emp.skills.forEach((s) => { empSkillMap[s.skillName.toLowerCase()] = s; });

        let strongCount = 0;
        const gaps = [];

        roleDoc.requiredSkills.forEach((req) => {
          const empSkill = empSkillMap[req.skillName.toLowerCase()];
          if (empSkill && empSkill.proficiencyLevel >= req.minimumLevel) {
            strongCount++;
          } else {
            gaps.push(req.skillName);
          }
        });

        const gapScore = roleDoc.requiredSkills.length > 0
          ? Math.round((strongCount / roleDoc.requiredSkills.length) * 100)
          : 0;

        return {
          employeeId: emp._id,
          name: emp.name,
          currentRole: emp.currentRole,
          targetRole: emp.targetRole,
          gapScore,
          topGaps: gaps.slice(0, 3),
        };
      })
    );

    return res.status(200).json({ department, teamAnalysis });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error during team analysis.' });
  }
};

module.exports = { analyzeEmployee, analyzeTeam };
