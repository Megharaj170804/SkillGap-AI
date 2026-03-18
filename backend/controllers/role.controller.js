const Role = require('../models/Role');
const Employee = require('../models/Employee');

// GET /api/roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().lean();
    return res.status(200).json(roles);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/roles
const createRole = async (req, res) => {
  try {
    const { roleName, requiredSkills } = req.body;
    if (!roleName) return res.status(400).json({ message: 'roleName is required.' });
    const existing = await Role.findOne({ roleName }).lean();
    if (existing) return res.status(400).json({ message: 'Role name already exists.' });
    const role = await Role.create({ roleName, requiredSkills: requiredSkills || [] });
    return res.status(201).json(role);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/roles/:id
const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ message: 'Role not found.' });
    return res.status(200).json(role);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/roles/:id
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).lean();
    if (!role) return res.status(404).json({ message: 'Role not found.' });

    // Check if employees are using this as targetRole
    const affectedCount = await Employee.countDocuments({ targetRole: role.roleName });
    const force = req.query.force === 'true';

    if (affectedCount > 0 && !force) {
      return res.status(400).json({
        message: `${affectedCount} employee(s) have this as their target role.`,
        affectedCount,
        canForce: true,
      });
    }

    if (affectedCount > 0 && force) {
      await Employee.updateMany({ targetRole: role.roleName }, { $unset: { targetRole: '' } });
    }

    await Role.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Role deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllRoles, createRole, updateRole, deleteRole };
