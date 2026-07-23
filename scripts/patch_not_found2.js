const fs = require('fs');
let file = fs.readFileSync('app/not-found.tsx', 'utf8');
file = file.replace('export const dynamic = "force-dynamic";', '');
fs.writeFileSync('app/not-found.tsx', file);
