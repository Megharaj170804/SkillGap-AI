require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Role = require('./models/Role');
const LearningProgress = require('./models/LearningProgress');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.');
};

async function computeGapScore(employee) {
  if (!employee.targetRole) return 0;
  try {
    const roleDoc = await Role.findOne({ roleName: employee.targetRole }).lean();
    if (!roleDoc || !roleDoc.requiredSkills.length) return 0;
    const empSkillMap = {};
    (employee.skills || []).forEach((s) => {
      empSkillMap[s.skillName.toLowerCase()] = s.proficiencyLevel;
    });
    let strongCount = 0;
    roleDoc.requiredSkills.forEach((req) => {
      const lvl = empSkillMap[req.skillName.toLowerCase()] || 0;
      if (lvl >= req.minimumLevel) strongCount++;
    });
    return Math.round((strongCount / roleDoc.requiredSkills.length) * 100);
  } catch {
    return 0;
  }
}

const run = async () => {
  try {
    await connectDB();
    
    // Create roles if missing
    let rolesCount = await Role.countDocuments();
    if (rolesCount === 0) {
      console.log('Creating mock roles...');
      await Role.create({
        roleName: 'Senior Developer',
        department: 'Engineering',
        requiredSkills: [
          { skillName: 'JavaScript', minimumLevel: 4, priority: 'critical' },
          { skillName: 'React', minimumLevel: 4, priority: 'critical' },
        ],
      });
      await Role.create({
        roleName: 'Data Scientist',
        department: 'Data',
        requiredSkills: [
          { skillName: 'Python', minimumLevel: 4, priority: 'critical' },
          { skillName: 'SQL', minimumLevel: 4, priority: 'critical' },
        ],
      });
    }

    // Create and auto-compute employees
    let employees = await Employee.find();
    if (employees.length === 0) {
      console.log('Creating mock employees...');
      await Employee.create({
        name: 'Alice Dev', email: 'alice@dev.com', department: 'Engineering', currentRole: 'Junior Dev', targetRole: 'Senior Developer',
        skills: [{ skillName: 'JavaScript', proficiencyLevel: 2, yearsOfExperience: 1 }], lastActive: new Date()
      });
      await Employee.create({
        name: 'Bob Data', email: 'bob@data.com', department: 'Data', currentRole: 'Analyst', targetRole: 'Data Scientist',
        skills: [{ skillName: 'Python', proficiencyLevel: 3, yearsOfExperience: 2 }, { skillName: 'SQL', proficiencyLevel: 5, yearsOfExperience: 4 }], lastActive: new Date()
      });
      
      // Fetch again
      employees = await Employee.find();
    }

    console.log(`Re-computing gapScore for ${employees.length} employees...`);
    for (let emp of employees) {
      const score = await computeGapScore(emp);
      emp.gapScore = score;
      // Also add dummy AI learning path just to show AI data on dashboard
      emp.aiLearningPath = [
        { week: 'Week 1', focus: 'Fundamentals', activities: ['Read docs', 'Watch tutorial'] }
      ];
      emp.lastAnalysisAt = new Date();
      await emp.save();
    }

    // Create some learning progress records to show completed courses
    console.log('Adding mock learning progress...');
    for (let emp of employees) {
      const existing = await LearningProgress.findOne({ employeeId: emp._id });
      if (!existing) {
        await LearningProgress.create({
          employeeId: emp._id,
          skillName: 'React',
          totalHoursSpent: 12,
          completedCourses: [
            { courseName: 'Advanced React', completedAt: new Date(), skillGained: 'React' }
          ]
        });
      }
    }

    console.log('Data successfully populated and gapScores updated!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
