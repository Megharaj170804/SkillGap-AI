const Skill = require('../models/Skill');
const Role = require('../models/Role');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

// GET /api/skills
const getAllSkills = async (req, res) => {
  try {
    const allSkills = await Skill.find().lean();
    return res.status(200).json(allSkills);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/skills/sync
const syncSkills = async (req, res) => {
  try {
    const roles = await Role.find().lean();
    const employees = await Employee.find().lean();
    const projects = await Project.find().lean();

    const uniqueSkills = new Set();
    roles.forEach(r => (r.requiredSkills || []).forEach(s => uniqueSkills.add(s.skillName)));
    employees.forEach(e => (e.skills || []).forEach(s => uniqueSkills.add(s.skillName)));
    projects.forEach(p => (p.requiredSkills || []).forEach(s => uniqueSkills.add(s.skillName)));

    const existingSkills = await Skill.find().lean();
    existingSkills.forEach(s => uniqueSkills.add(s.name));

    await Skill.deleteMany({});
    const ops = Array.from(uniqueSkills).map(name => ({ name }));
    if (ops.length > 0) {
      await Skill.insertMany(ops);
    }
    
    return res.status(200).json({ message: 'Skills synced', count: ops.length });
  } catch (err) {
    console.error('Skill Sync Error', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/skills
const createSkill = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Skill name is required.' });
    const trimmedName = name.trim();
    
    const existing = await Skill.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) return res.status(400).json({ message: 'Skill already exists.' });
    
    const skill = await Skill.create({ name: trimmedName });
    return res.status(201).json(skill);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/skills/rename
const updateSkill = async (req, res) => {
  try {
    const { oldName, newName } = req.body; 
    if (!oldName || !newName?.trim()) return res.status(400).json({ message: 'oldName and newName are required.' });
    
    const cleanNewName = newName.trim();
    
    const existing = await Skill.findOne({ name: { $regex: new RegExp(`^${cleanNewName}$`, 'i') } });
    if (existing && existing.name !== oldName) {
      return res.status(400).json({ message: 'Another skill with the new name already exists.' });
    }

    // Update Skill document
    await Skill.findOneAndUpdate({ name: oldName }, { name: cleanNewName }, { upsert: true });

    // Cascade Updates
    await Role.updateMany(
      { "requiredSkills.skillName": oldName },
      { $set: { "requiredSkills.$[elem].skillName": cleanNewName } },
      { arrayFilters: [{ "elem.skillName": oldName }] }
    );

    await Employee.updateMany(
      { "skills.skillName": oldName },
      { $set: { "skills.$[elem].skillName": cleanNewName } },
      { arrayFilters: [{ "elem.skillName": oldName }] }
    );

    await Project.updateMany(
      { "requiredSkills.skillName": oldName },
      { $set: { "requiredSkills.$[elem].skillName": cleanNewName } },
      { arrayFilters: [{ "elem.skillName": oldName }] }
    );

    return res.status(200).json({ message: 'Skill renamed successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/skills/:name
const deleteSkill = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ message: 'Skill name is required.' });

    // Delete standalone skill
    await Skill.findOneAndDelete({ name });

    // Cascade Delete
    await Role.updateMany(
      { "requiredSkills.skillName": name },
      { $pull: { requiredSkills: { skillName: name } } }
    );

    await Employee.updateMany(
      { "skills.skillName": name },
      { $pull: { skills: { skillName: name } } }
    );

    await Project.updateMany(
      { "requiredSkills.skillName": name },
      { $pull: { requiredSkills: { skillName: name } } }
    );

    return res.status(200).json({ message: 'Skill deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllSkills, syncSkills, createSkill, updateSkill, deleteSkill };
