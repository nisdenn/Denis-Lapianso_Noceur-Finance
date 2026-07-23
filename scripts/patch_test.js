const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');
file = file.replace(
  'export async function getUserSheetId() {',
  `export async function getUserSheetId() {
  if (process.env.TEST_SHEET_ID) return process.env.TEST_SHEET_ID;`
);
fs.writeFileSync('lib/google-sheets.ts', file);
