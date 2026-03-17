const Role = require('../models/Role');

// GET /api/roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    return res.status(200).json(roles);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/roles
const createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    return res.status(201).json(role);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
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
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/roles/:id
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found.' });
    return res.status(200).json({ message: 'Role deleted successfully.' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllRoles, createRole, updateRole, deleteRole };
