const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');

// GET /api/search?q=query
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ employees: [], roles: [] });

    const regex = new RegExp(q.trim(), 'i');

    const employees = await Employee.find({
      $or: [
        { name: regex },
        { currentRole: regex },
        { department: regex },
        { 'skills.skillName': regex },
      ],
    })
      .select('name currentRole targetRole department skills')
      .limit(10);

    const roles = await Role.find({ roleName: regex }).select('roleName').limit(5);

    return res.json({ employees, roles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { globalSearch };
