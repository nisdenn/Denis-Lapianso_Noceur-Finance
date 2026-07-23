const fs = require('fs');
let code = fs.readFileSync('app/actions/settings.ts', 'utf8');
code = code.replace(/await updateUserSheetId\(session\.username, sheetId\);/g, `try {
    await updateUserSheetId(session.username, sheetId);
  } catch (e) {
    console.warn("Could not update master sheet, updating session only.");
  }`);
fs.writeFileSync('app/actions/settings.ts', code);
