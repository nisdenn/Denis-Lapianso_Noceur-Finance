const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');

file = file.replace(
  `const rows = await sheet.getRows();
    console.log("Delete request for ID:", id);
    rows.forEach(r => {
      const data = {
        date: r.get('Date') || '',
        description: r.get('Description') || '',
        category: r.get('Category') || '',
        fromAccount: r.get('FromWallet') || '',
        toAccount: r.get('ToWallet') || '',
        amount: r.get('Amount') || '0',
      };
      const rowId = Buffer.from(JSON.stringify(data)).toString('base64');
      if (rowId === id) console.log("FOUND MATCH!");
    });`,
  `const rows = await sheet.getRows();`
);

fs.writeFileSync('lib/google-sheets.ts', file);
