const mongoose = require('mongoose');

const nudgeLogSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  sentAt: { type: Date, default: Date.now }
});

// Index for checking 24-hour limits quickly
nudgeLogSchema.index({ managerId: 1, employeeId: 1, sentAt: -1 });

module.exports = mongoose.model('NudgeLog', nudgeLogSchema);
