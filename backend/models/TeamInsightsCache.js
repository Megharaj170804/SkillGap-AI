const mongoose = require('mongoose');

const teamInsightsCacheSchema = new mongoose.Schema({
  department: { type: String, required: true, unique: true },
  insights: { type: Object, required: true },
  generatedAt: { type: Date, default: Date.now }
});

// Cache expires after 24 hours (86400 seconds)
teamInsightsCacheSchema.index({ generatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('TeamInsightsCache', teamInsightsCacheSchema);
