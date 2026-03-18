const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  techStack: [{ type: String }],
  requiredSkills: [
    {
      skillName: { type: String, required: true },
      level: { type: Number, required: true, min: 1, max: 5 }
    }
  ],
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  deadline: { type: Date, required: true },
  assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  skillCoveragePercent: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  aiAnalysis: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

projectSchema.index({ managerId: 1, department: 1 });

module.exports = mongoose.model('Project', projectSchema);
