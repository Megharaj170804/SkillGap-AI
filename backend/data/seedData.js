require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Role.deleteMany({});
    console.log('Cleared existing data.');

    // Create roles (skills matrix)
    const roles = await Role.insertMany([
      {
        roleName: 'Senior Developer',
        requiredSkills: [
          { skillName: 'Node.js', minimumLevel: 4, priority: 'critical' },
          { skillName: 'AWS', minimumLevel: 3, priority: 'important' },
          { skillName: 'System Design', minimumLevel: 4, priority: 'critical' },
          { skillName: 'Docker', minimumLevel: 3, priority: 'important' },
          { skillName: 'React', minimumLevel: 4, priority: 'critical' },
        ],
      },
      {
        roleName: 'ML Engineer',
        requiredSkills: [
          { skillName: 'Python', minimumLevel: 4, priority: 'critical' },
          { skillName: 'TensorFlow', minimumLevel: 4, priority: 'critical' },
          { skillName: 'Scikit-learn', minimumLevel: 4, priority: 'critical' },
          { skillName: 'MLOps', minimumLevel: 3, priority: 'important' },
          { skillName: 'Deep Learning', minimumLevel: 3, priority: 'important' },
        ],
      },
      {
        roleName: 'Full Stack Developer',
        requiredSkills: [
          { skillName: 'React', minimumLevel: 4, priority: 'critical' },
          { skillName: 'Node.js', minimumLevel: 4, priority: 'critical' },
          { skillName: 'MongoDB', minimumLevel: 3, priority: 'important' },
          { skillName: 'REST APIs', minimumLevel: 4, priority: 'critical' },
          { skillName: 'PostgreSQL', minimumLevel: 3, priority: 'good-to-have' },
        ],
      },
    ]);
    console.log('Created roles:', roles.map((r) => r.roleName));

    // Hash passwords
    const hashPwd = (pwd) => bcrypt.hashSync(pwd, 10);

    // Create users
    const adminUser = await User.create({
      name: 'Super Admin', email: 'admin@skillgap.com', password: hashPwd('admin123'), role: 'admin',
    });
    const managerUser = await User.create({
      name: 'Raj Manager', email: 'manager@skillgap.com', password: hashPwd('manager123'), role: 'manager', department: 'Engineering',
    });
    const rahulUser = await User.create({
      name: 'Rahul Sharma', email: 'rahul@skillgap.com', password: hashPwd('emp123'), role: 'employee', department: 'Engineering',
    });
    const priyaUser = await User.create({
      name: 'Priya Patel', email: 'priya@skillgap.com', password: hashPwd('emp123'), role: 'employee', department: 'Data Science',
    });
    const amitUser = await User.create({
      name: 'Amit Singh', email: 'amit@skillgap.com', password: hashPwd('emp123'), role: 'employee', department: 'Engineering',
    });

    // Create employees
    const rahulEmp = await Employee.create({
      name: 'Rahul Sharma', email: 'rahul@skillgap.com', department: 'Engineering',
      currentRole: 'Junior Developer', targetRole: 'Senior Developer',
      managerId: managerUser._id,
      skills: [
        { skillName: 'React', proficiencyLevel: 3, yearsOfExperience: 1 },
        { skillName: 'JavaScript', proficiencyLevel: 3, yearsOfExperience: 2 },
        { skillName: 'HTML/CSS', proficiencyLevel: 4, yearsOfExperience: 2 },
        { skillName: 'Git', proficiencyLevel: 3, yearsOfExperience: 1 },
      ],
    });

    const priyaEmp = await Employee.create({
      name: 'Priya Patel', email: 'priya@skillgap.com', department: 'Data Science',
      currentRole: 'Data Analyst', targetRole: 'ML Engineer',
      managerId: managerUser._id,
      skills: [
        { skillName: 'Python', proficiencyLevel: 3, yearsOfExperience: 2 },
        { skillName: 'Excel', proficiencyLevel: 4, yearsOfExperience: 3 },
        { skillName: 'SQL', proficiencyLevel: 4, yearsOfExperience: 2 },
        { skillName: 'Power BI', proficiencyLevel: 3, yearsOfExperience: 1 },
      ],
    });

    const amitEmp = await Employee.create({
      name: 'Amit Singh', email: 'amit@skillgap.com', department: 'Engineering',
      currentRole: 'Frontend Developer', targetRole: 'Full Stack Developer',
      managerId: managerUser._id,
      skills: [
        { skillName: 'React', proficiencyLevel: 4, yearsOfExperience: 2 },
        { skillName: 'CSS', proficiencyLevel: 4, yearsOfExperience: 3 },
        { skillName: 'JavaScript', proficiencyLevel: 4, yearsOfExperience: 2 },
        { skillName: 'Figma', proficiencyLevel: 3, yearsOfExperience: 1 },
      ],
    });

    // Link users to employees
    await User.findByIdAndUpdate(rahulUser._id, { employeeRef: rahulEmp._id });
    await User.findByIdAndUpdate(priyaUser._id, { employeeRef: priyaEmp._id });
    await User.findByIdAndUpdate(amitUser._id, { employeeRef: amitEmp._id });

    console.log('Seed data created successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin:    admin@skillgap.com   / admin123');
    console.log('  Manager:  manager@skillgap.com / manager123');
    console.log('  Employee: rahul@skillgap.com   / emp123');
    console.log('  Employee: priya@skillgap.com   / emp123');
    console.log('  Employee: amit@skillgap.com    / emp123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
