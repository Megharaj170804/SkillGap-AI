const Employee = require('../models/Employee');
const Role = require('../models/Role');
const User = require('../models/User');
const LearningProgress = require('../models/LearningProgress');
const Notification = require('../models/Notification');
const { computeGapScore } = require('./admin.controller');

// ─── GET /api/employees ────────────────────────────────────────────────────────
const getAllEmployees = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { page = 1, limit = 10, search = '', dept = '', filter = '' } = req.query;

    let query = {};

    if (role === 'manager') {
      const manager = await User.findById(id).lean();
      if (manager?.department) query.department = manager.department;
    }

    if (dept && dept !== 'All') query.department = dept;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { currentRole: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (filter === 'critical') query.gapScore = { $lt: 40 };
    else if (filter === 'on-track') query.gapScore = { $gte: 70 };
    else if (filter === 'inactive') {
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      query.lastActive = { $lt: cutoff };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [employees, total] = await Promise.all([
      Employee.find(query).skip(skip).limit(parseInt(limit)).lean(),
      Employee.countDocuments(query),
    ]);

    return res.json({
      employees,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/employees/:id ────────────────────────────────────────────────────
const getEmployeeById = async (req, res) => {
  try {
    const { role, id } = req.user;
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (role === 'employee') {
      const user = await User.findById(id).lean();
      if (!user?.employeeRef || user.employeeRef.toString() !== employee._id.toString()) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }
    return res.json(employee);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /api/employees ───────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, department, currentRole, targetRole, skills, managerId } = req.body;

    // Email uniqueness
    const existing = await User.findOne({ email: email?.toLowerCase() }).lean();
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    let userId = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashed, role: 'employee', department });
      userId = newUser._id;
    }

    const employee = await Employee.create({
      name, email, department, currentRole, targetRole,
      skills: skills || [],
      managerId: managerId || null,
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { employeeRef: employee._id });
    }

    // Compute and save gapScore
    const score = await computeGapScore(employee.toObject());
    await Employee.findByIdAndUpdate(employee._id, { gapScore: score });

    // Socket events
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('stats_updated', { type: 'new_employee' });
      io.to(`dept_${department}`).emit('new_employee_added', { employee: { ...employee.toObject(), gapScore: score } });
      io.to('admin_room').emit('activity_feed_update', {
        type: 'new_employee',
        message: `${name} joined ${department}`,
        employeeName: name,
        dot: '👤',
        color: '#10b981',
        timeAgo: 'just now',
      });
    }

    // Notify admins
    const admins = await User.find({ role: 'admin' }).lean();
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: '👤 New Employee Added',
        message: `${name} has been added to ${department}.`,
        type: 'skill_update',
      });
      if (io) io.to(`user_${admin._id}`).emit('new_notification', {});
    }

    return res.status(201).json({ ...employee.toObject(), gapScore: score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during employee creation.' });
  }
};

// ─── PUT /api/employees/:id ────────────────────────────────────────────────────
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date(), lastActive: new Date() },
      { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Recalculate gapScore
    const newScore = await computeGapScore(employee.toObject());
    await Employee.findByIdAndUpdate(employee._id, { gapScore: newScore });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('stats_updated', { type: 'gap_changed' });
      io.to(`employee_${employee._id}`).emit('your_gap_updated', { newScore });

      if (newScore < 40) {
        io.to('admin_room').emit('critical_alert', { employee: { name: employee.name, _id: employee._id }, score: newScore });

        // Notify admins
        const admins = await User.find({ role: 'admin' }).lean();
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: '⚠️ Critical Gap Alert',
            message: `${employee.name} dropped to critical gap score: ${newScore}%`,
            type: 'gap_alert',
          });
          io.to(`user_${admin._id}`).emit('new_notification', {});
        }
      }
    }

    return res.json({ ...employee.toObject(), gapScore: newScore });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /api/employees/:id ─────────────────────────────────────────────────
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Cascade delete
    await Promise.all([
      User.deleteOne({ employeeRef: employee._id }),
      LearningProgress.deleteMany({ employeeId: employee._id }),
      Notification.deleteMany({ userId: req.params.id }),
    ]);

    const io = req.app.get('io');
    if (io) io.to('admin_room').emit('stats_updated', { type: 'employee_deleted' });

    return res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/check-email ──────────────────────────────────────────────────────
const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'email is required.' });
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    return res.json({ available: !existing });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, checkEmail };
