const fs = require('fs');
let code = fs.readFileSync('app/actions/settings.ts', 'utf8');

const newLogic = `  let sheetId = formData.get('sheetId') as string;
  const session = await getSession();

  if (!session || !sheetId) return;

  // Extract ID if a full URL was provided
  const match = sheetId.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    sheetId = match[1];
  }
`;

code = code.replace(/  const sheetId = formData\.get\('sheetId'\) as string;\n  const session = await getSession\(\);\n\n  if \(!session \|\| !sheetId\) return;/, newLogic);

fs.writeFileSync('app/actions/settings.ts', code);
