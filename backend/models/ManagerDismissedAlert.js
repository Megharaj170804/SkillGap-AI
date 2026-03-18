const mongoose = require('mongoose');

const managerDismissedAlertSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alertId: { type: String, required: true }, // Can be an ID or a generated unique string (e.g. employeeId_type)
  dismissedAt: { type: Date, default: Date.now }
});

// TTL index to automatically delete records after 7 days (604800 seconds)
managerDismissedAlertSchema.index({ dismissedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ManagerDismissedAlert', managerDismissedAlertSchema);
