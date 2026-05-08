const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  employeeId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  managerId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerName:        { type: String, required: true },
  employeeName:       { type: String, required: true },
  certificateType:    { type: String, enum: ['excellence','most_improved','skill_champion','consistency_star'] },
  certificateTitle:   { type: String },
  message:            { type: String },
  achievementText:    { type: String },
  improvementPercent: { type: Number },
  certificateId:      { type: String, unique: true },
  issuedAt:           { type: Date, default: Date.now }
});

certificateSchema.index({ employeeId: 1, issuedAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
