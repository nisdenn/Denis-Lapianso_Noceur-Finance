const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'components/SettingsForm.tsx',
  'components/layout/Sidebar.tsx',
  'components/layout/MobileHeader.tsx',
  'app/(dashboard)/page.tsx',
  'app/(dashboard)/transactions/page.tsx',
  'app/(dashboard)/settings/page.tsx',
  'app/(dashboard)/wallets/page.tsx',
  'app/(dashboard)/layout.tsx',
  'app/(dashboard)/goals/page.tsx',
  'app/(dashboard)/budgets/page.tsx',
  'app/(dashboard)/admin/page.tsx',
  'app/(dashboard)/accounts/page.tsx',
  'app/actions.ts',
  'app/api/settings/route.ts',
  'app/actions/settings.ts',
  'app/actions/auth.ts',
  'app/actions/admin.ts'
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace all occurrences of google-sheets with db
    content = content.replace(/'@\/lib\/google-sheets'/g, "'@/lib/db'");
    content = content.replace(/"@\/lib\/google-sheets"/g, '"@/lib/db"');
    content = content.replace(/'\.\.\/\.\.\/lib\/google-sheets'/g, "'../../lib/db'");
    content = content.replace(/"\.\.\/\.\.\/lib\/google-sheets"/g, '"../../lib/db"');
    content = content.replace(/'\.\.\/lib\/google-sheets'/g, "'../lib/db'");
    content = content.replace(/"\.\.\/lib\/google-sheets"/g, '"../lib/db"');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
