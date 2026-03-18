const mongoose = require('mongoose');

const managerActionSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  actionText: { type: String, required: true },
  weekLabel: { type: String, required: true }, // e.g., "Week 1-4"
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

managerActionSchema.index({ managerId: 1, department: 1 });

module.exports = mongoose.model('ManagerAction', managerActionSchema);
