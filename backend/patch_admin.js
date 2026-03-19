const fs = require('fs');
let c = fs.readFileSync('controllers/admin.controller.js', 'utf8');

const targetStr = `    employees.forEach((emp) => {
      const d = emp.department || 'Unknown';
      if (!deptMap[d]) {`;

const replacementStr = `    const managers = await Employee.find({ currentRole: { $regex: /manager/i } }).lean();
    
    employees.forEach((emp) => {
      const d = emp.department || 'Unknown';
      if (!deptMap[d]) {
        const tempManager = managers.find(m => m.department === d);
        const headName = tempManager ? tempManager.name : 'Unassigned';
        const headAvatar = tempManager ? tempManager.name.charAt(0).toUpperCase() : d.charAt(0).toUpperCase();`;

if (!c.includes(targetStr)) { console.log('not found'); process.exit(1); }

c = c.replace(targetStr, replacementStr);
c = c.replace(`head: 'Unassigned',`, `head: headName,`);
c = c.replace(`headAvatar: d.charAt(0).toUpperCase(),`, `headAvatar: headAvatar,`);

fs.writeFileSync('controllers/admin.controller.js', c, 'utf8');
console.log('patched admin controller');
