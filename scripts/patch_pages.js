const fs = require('fs');
for (const p of ['app/login/page.tsx', 'app/(dashboard)/settings/page.tsx']) {
  if (fs.existsSync(p)) {
    let file = fs.readFileSync(p, 'utf8');
    file = file.replace('export const dynamic = "force-dynamic";\n', '');
    file = file.replace('export const dynamic = "force-dynamic";', '');
    fs.writeFileSync(p, file);
  }
}
