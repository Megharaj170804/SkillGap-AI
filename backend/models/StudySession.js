const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  weekNumber: { type: Number },
  skillName: { type: String, required: true },
  hoursSpent: { type: Number, required: true, min: 0.1 },
  notes: { type: String },
  activityType: { type: String, default: 'study' },
  date: { type: Date, default: Date.now }
});

studySessionSchema.index({ employeeId: 1, date: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
