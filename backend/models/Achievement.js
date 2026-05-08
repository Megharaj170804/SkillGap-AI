const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '🏆' },
  badgeId: { type: String },
  earnedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ employeeId: 1, earnedAt: -1 });

module.exports = mongoose.model('Achievement', achievementSchema);
