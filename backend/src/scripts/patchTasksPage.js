import fs from 'fs';

const filePath = 'c:/Users/Shubham/OneDrive/Desktop/Form/Task-Allocater/frontend/src/pages/tasks/TasksPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace handleCreateTask assignee check
content = content.replace(
  /const assigneeId = formData\.assigneeId \|\| \(!isUserAdminCeo \? user\.employeeId : null\);[\s\S]*?if \(!assigneeId\) \{[\s\S]*?toast\.error\('Please select an employee to assign this task to\.'\);[\s\S]*?return;[\s\S]*?\}/,
  `const assigneeId = formData.assigneeId || (!isUserAdminCeo ? user.employeeId : 'AUTO');`
);

// Replace select required
content = content.replace(
  /required=\{isCeoOrAdmin\(user\)\}/g,
  ''
);

// Replace select option
content = content.replace(
  /<option value="">Select Employee\.\.\.<\/option>/g,
  `<option value="">✨ Auto-Assign via AI (AI selects best employee)</option>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ TasksPage.jsx updated');

