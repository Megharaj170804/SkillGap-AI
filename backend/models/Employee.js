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
  learningPreferences: {
    hoursPerWeek: { type: Number, default: 10 },
    focusAreas: { type: [String], default: [] },
    learningStyle: { type: String, default: 'Video-focused' }
  },
  aiCareerAdvice: { type: Object, default: null },
  lastAnalysisAt: { type: Date, default: null },
  savedProjectAnalyses: { type: Array, default: [] },
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  // Computed readiness score (0-100)
  gapScore: { type: Number, default: 0, min: 0, max: 100 },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for query performance
employeeSchema.index({ department: 1 });
employeeSchema.index({ gapScore: 1 });
employeeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Employee', employeeSchema);
