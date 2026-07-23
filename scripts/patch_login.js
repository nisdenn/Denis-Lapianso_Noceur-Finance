const fs = require('fs');
let file = fs.readFileSync('app/login/page.tsx', 'utf8');
file = 'export const dynamic = "force-dynamic";\n' + file;
fs.writeFileSync('app/login/page.tsx', file);

file = fs.readFileSync('app/(dashboard)/settings/page.tsx', 'utf8');
file = 'export const dynamic = "force-dynamic";\n' + file;
fs.writeFileSync('app/(dashboard)/settings/page.tsx', file);
