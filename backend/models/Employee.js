const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  currentRole: { type: String, required: true },
  department: { type: String, required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skills: [
    {
      skillName: { type: String, required: true },
      proficiencyLevel: { type: Number, min: 1, max: 5, required: true },
      yearsOfExperience: { type: Number, default: 0 },
    },
  ],
  projectHistory: [
    {
      projectName: { type: String },
      technologiesUsed: [String],
      duration: { type: String },
    },
  ],
  targetRole: { type: String },
  // AI-enhanced fields
  aiLearningPath: { type: Array, default: [] },
  aiCareerAdvice: { type: Object, default: null },
  lastAnalysisAt: { type: Date, default: null },
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Employee', employeeSchema);
