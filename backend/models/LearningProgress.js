const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  skillName: { type: String, required: true },
  targetLevel: { type: Number, min: 1, max: 5 },
  currentLevel: { type: Number, min: 0, max: 5 },
  completedCourses: [
    {
      courseName: { type: String },
      completedAt: { type: Date },
      hoursSpent: { type: Number, default: 0 },
    },
  ],
  weeklyGoalHours: { type: Number, default: 5 },
  totalHoursSpent: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
