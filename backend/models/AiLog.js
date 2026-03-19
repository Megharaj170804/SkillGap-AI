const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, index: true },
  success: { type: Boolean, default: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('AiLog', aiLogSchema);
