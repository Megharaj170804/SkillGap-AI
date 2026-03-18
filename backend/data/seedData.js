require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
};

const ROLES = [
  {
    roleName: 'Junior Developer',
    requiredSkills: [
      { skillName: 'JavaScript', minimumLevel: 2, priority: 'critical' },
      { skillName: 'React', minimumLevel: 2, priority: 'critical' },
      { skillName: 'Git', minimumLevel: 2, priority: 'important' },
    ],
  },
  {
    roleName: 'Senior Developer',
    requiredSkills: [
      { skillName: 'JavaScript', minimumLevel: 4, priority: 'critical' },
      { skillName: 'React', minimumLevel: 4, priority: 'critical' },
      { skillName: 'System Design', minimumLevel: 3, priority: 'critical' },
      { skillName: 'Node.js', minimumLevel: 3, priority: 'important' },
      { skillName: 'AWS', minimumLevel: 2, priority: 'good-to-have' },
    ],
  },
  {
    roleName: 'Data Scientist',
    requiredSkills: [
      { skillName: 'Python', minimumLevel: 4, priority: 'critical' },
      { skillName: 'SQL', minimumLevel: 4, priority: 'critical' },
      { skillName: 'Machine Learning', minimumLevel: 3, priority: 'critical' },
      { skillName: 'TensorFlow', minimumLevel: 2, priority: 'important' },
      { skillName: 'Data Visualization', minimumLevel: 3, priority: 'important' },
    ],
  },
];

const EMPLOYEES = [
  {
    name: 'Alice Junior',
    email: 'alice@test.com',
    currentRole: 'Junior Developer',
    targetRole: 'Senior Developer',
    department: 'Engineering',
    skills: [
      { skillName: 'JavaScript', proficiencyLevel: 3, yearsOfExperience: 1 },
      { skillName: 'React', proficiencyLevel: 2, yearsOfExperience: 1 },
      { skillName: 'Git', proficiencyLevel: 3, yearsOfExperience: 1 },
    ],
    projectHistory: [
      {
        projectName: 'Internal Dashboard UI',
        technologiesUsed: ['React', 'CSS', 'JavaScript'],
        duration: '3 months',
      },
    ],
  },
  {
    name: 'Bob Senior',
    email: 'bob@test.com',
    currentRole: 'Senior Developer',
    targetRole: 'Engineering Manager',
    department: 'Engineering',
    skills: [
      { skillName: 'JavaScript', proficiencyLevel: 5, yearsOfExperience: 5 },
      { skillName: 'React', proficiencyLevel: 5, yearsOfExperience: 4 },
      { skillName: 'System Design', proficiencyLevel: 4, yearsOfExperience: 3 },
      { skillName: 'Node.js', proficiencyLevel: 4, yearsOfExperience: 3 },
      { skillName: 'Leadership', proficiencyLevel: 2, yearsOfExperience: 1 }, // Gap for manager
    ],
    projectHistory: [
      {
        projectName: 'Payment Gateway Migration',
        technologiesUsed: ['Node.js', 'AWS', 'System Design'],
        duration: '6 months',
      },
      {
        projectName: 'Frontend Architecture Revamp',
        technologiesUsed: ['React', 'JavaScript'],
        duration: '4 months',
      },
    ],
  },
  {
    name: 'Charlie Data',
    email: 'charlie@test.com',
    currentRole: 'Data Analyst',
    targetRole: 'Data Scientist',
    department: 'Data Science',
    skills: [
      { skillName: 'Python', proficiencyLevel: 3, yearsOfExperience: 2 },
      { skillName: 'SQL', proficiencyLevel: 4, yearsOfExperience: 3 },
      { skillName: 'Data Visualization', proficiencyLevel: 4, yearsOfExperience: 2 },
      { skillName: 'Machine Learning', proficiencyLevel: 1, yearsOfExperience: 0 }, // Major gap
    ],
    projectHistory: [
      {
        projectName: 'Q3 Sales Report Optimization',
        technologiesUsed: ['SQL', 'Tableau', 'Data Visualization'],
        duration: '2 months',
      },
    ],
  },
];

const seedDB = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  // Only clear mock users to preserve admin account if needed, but easiest to clear all for clean slate
  await User.deleteMany({ email: { $in: ['alice@test.com', 'bob@test.com', 'charlie@test.com'] } });
  await Employee.deleteMany({ email: { $in: ['alice@test.com', 'bob@test.com', 'charlie@test.com'] } });
  await Role.deleteMany({ roleName: { $in: ['Junior Developer', 'Senior Developer', 'Data Scientist'] } });

  console.log('Seeding Roles...');
  await Role.insertMany(ROLES);

  console.log('Seeding Employees & Users...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  for (const empData of EMPLOYEES) {
    // 1. Create Employee
    const employee = await Employee.create(empData);
    
    // 2. Create corresponding User account linked to the Employee
    await User.create({
      name: employee.name,
      email: employee.email,
      password: hashedPassword,
      role: 'employee',
      department: employee.department,
      employeeRef: employee._id,
    });
    console.log(`Created: ${employee.name} (${employee.email}) - target: ${employee.targetRole}`);
  }

  // Pre-hash password for old employee and admin to restore them if they got dropped
  // Let's also restore the super admin just in case they were deleted.
  try {
      const adminExists = await User.findOne({ email: 'admin@skillgap.com' });
      if (!adminExists) {
        await User.create({
          name: 'Super Admin', email: 'admin@skillgap.com', password: hashedPassword, role: 'admin',
        });
        console.log(`Created: Super Admin (admin@skillgap.com)`);
      }
  } catch(e) {}

  console.log('\n✅ Database seeded successfully!');
  console.log('You can login with the following credentials (Password for all: password123):');
  console.log('- alice@test.com (Junior -> Senior Developer)');
  console.log('- bob@test.com (Senior -> Manager)');
  console.log('- charlie@test.com (Analyst -> Data Scientist)');

  process.exit();
};

seedDB();
