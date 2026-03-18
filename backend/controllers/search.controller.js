const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');

// GET /api/search?q=query
const globalSearch = async (req, res) => {
  try {
    const { q, scope, department } = req.query;
    if (!q || q.trim().length < 2) return res.json({ employees: [], roles: [] });

    const regex = new RegExp(q.trim(), 'i');
    const query = {
      $or: [
        { name: regex },
        { currentRole: regex },
        { department: regex },
        { 'skills.skillName': regex },
      ]
    };
    // Apply manager scope strictly from token for security
    const isManager = (req.user && req.user.role === 'manager') || scope === 'manager';
    
    if (req.user && req.user.role === 'manager') {
      if (req.user.department) {
        query.department = req.user.department;
      }
    } else if (scope === 'manager' && department) {
      query.department = department; // Fallback
    }

    const employees = await Employee.find(query)
      .select('name currentRole targetRole department gapScore skills')
      .limit(10);

    let roles = [];
    if (!isManager) {
       roles = await Role.find({ roleName: regex }).select('roleName').limit(5);
    }

    return res.json({ employees, roles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { globalSearch };
