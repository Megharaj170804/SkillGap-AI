const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'employee',
      department,
    });

    return res.status(201).json({ message: 'Registered successfully', userId: user._id });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const payload = { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department };
    const token = jwt.sign(payload, process.env.JWT_SECRET); // No expiry — token lasts forever

    // Set httpOnly cookie (10 years maxAge so it persists across browser sessions)
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // ~10 years
      sameSite: 'lax',
    });

    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, employeeRef: user.employeeRef },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(user);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, logout, getMe, changePassword };
