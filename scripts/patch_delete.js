const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');
file = file.replace(
  `      await row.delete();
      return tx;`,
  `      console.log('--- FOUND ROW TO DELETE ---', rowId);
      await row.delete();
      console.log('--- ROW DELETED SUCCESSFULLY ---');
      return tx;`
);
fs.writeFileSync('lib/google-sheets.ts', file);
