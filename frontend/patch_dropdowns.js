import fs from 'fs';

// 1. Update CeoTaskCreateModal.jsx
let modal = fs.readFileSync('src/components/ceo/CeoTaskCreateModal.jsx', 'utf8');
modal = modal.replace(
  'const desig = emp.designationTitle || emp.designation?.title || emp.departmentName || \'\';',
  'const desig = emp.desig_title || emp.designationTitle || emp.designation?.title || emp.dept_name || emp.departmentName || \'\';'
);
fs.writeFileSync('src/components/ceo/CeoTaskCreateModal.jsx', modal, 'utf8');

// 2. Update CeoTaskManagement.jsx
let mgmt = fs.readFileSync('src/components/ceo/CeoTaskManagement.jsx', 'utf8');
const oldOption = `{assignableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName || \`\${emp.firstName || ''} \${emp.lastName || ''}\`.trim()} — {emp.departmentName || emp.department || 'Operations'}
                </option>
              ))}`;

const newOption = `{assignableEmployees.map((emp) => {
                const name = emp.fullName || \`\${emp.firstName || emp.first_name || ''} \${emp.lastName || emp.last_name || ''}\`.trim() || emp.name || 'Employee';
                const role = emp.desig_title || emp.designationTitle || emp.dept_name || emp.departmentName || 'Specialist';
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} — {role}
                  </option>
                );
              })}`;

mgmt = mgmt.replace(oldOption.replace(/\r\n/g, '\n'), newOption.replace(/\r\n/g, '\n'));
// Also handle CRLF if present
mgmt = mgmt.replace(oldOption.replace(/\n/g, '\r\n'), newOption.replace(/\n/g, '\r\n'));
fs.writeFileSync('src/components/ceo/CeoTaskManagement.jsx', mgmt, 'utf8');

console.log('Updated employee name and designation resolvers.');

