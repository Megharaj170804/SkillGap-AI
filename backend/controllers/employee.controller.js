const Employee = require('../models/Employee');
const User = require('../models/User');

// GET /api/employees
const getAllEmployees = async (req, res) => {
  try {
    const { role, id, department } = req.user;
    let query = {};

    if (role === 'manager') {
      // Find the manager's department
      const manager = await User.findById(id);
      if (manager && manager.department) {
        query.department = manager.department;
      }
    }

    if (department && role !== 'admin') {
      query.department = department;
    }

    const employees = await Employee.find(query).populate('managerId', 'name email');
    return res.status(200).json(employees);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const { role, id } = req.user;
    const employee = await Employee.findById(req.params.id).populate('managerId', 'name email');

    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Employee can only access own profile
    if (role === 'employee') {
      const user = await User.findById(id);
      if (!user || !user.employeeRef || user.employeeRef.toString() !== employee._id.toString()) {
        return res.status(403).json({ message: 'Forbidden. You can only view your own profile.' });
      }
    }

    return res.status(200).json(employee);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/employees (admin only)
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, department, currentRole, targetRole, skills, managerId } = req.body;

    // Create user account if password provided
    let userId = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const newUser = await User.create({
        name, email, password: hashed, role: 'employee', department,
      });
      userId = newUser._id;
    }

    const employee = await Employee.create({
      name, email, department, currentRole, targetRole,
      skills: skills || [],
      managerId: managerId || null,
    });

    // Link user to employee
    if (userId) {
      await User.findByIdAndUpdate(userId, { employeeRef: employee._id });
    }

    return res.status(201).json(employee);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error during employee creation.' });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    return res.status(200).json(employee);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/employees/:id (admin only)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    return res.status(200).json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };
