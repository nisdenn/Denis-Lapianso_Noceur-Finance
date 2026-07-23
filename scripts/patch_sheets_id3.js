const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');

file = file.replace(
  "    const headers = ['Date', 'Description', 'Category', 'FromWallet', 'ToWallet', 'Amount'];\n    const sheet = await getSheet('Data', headers);",
  "    const headers = ['Date', 'Description', 'Category', 'FromWallet', 'ToWallet', 'Amount', 'TransactionID'];\n    const sheet = await getSheet('Data', headers);"
);

fs.writeFileSync('lib/google-sheets.ts', file);
