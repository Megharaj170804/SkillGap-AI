const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: { type: String, required: true, unique: true },
  requiredSkills: [
    {
      skillName: { type: String, required: true },
      minimumLevel: { type: Number, min: 1, max: 5, required: true },
      priority: {
        type: String,
        enum: ['critical', 'important', 'good-to-have'],
        default: 'important',
      },
    },
  ],
});

module.exports = mongoose.model('Role', roleSchema);
