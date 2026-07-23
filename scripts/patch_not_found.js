const fs = require('fs');
let file = fs.readFileSync('app/not-found.tsx', 'utf8');
file = 'export const dynamic = "force-dynamic";\n' + file;
fs.writeFileSync('app/not-found.tsx', file);
