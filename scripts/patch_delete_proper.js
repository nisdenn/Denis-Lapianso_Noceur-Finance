const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');

file = file.replace(
  `    const row = rows.find(r => {
      const data = {
        date: r.get('Date') || '',
        description: r.get('Description') || '',
        category: r.get('Category') || '',
        fromAccount: r.get('FromWallet') || '',
        toAccount: r.get('ToWallet') || '',
        amount: r.get('Amount') || '0',
      };
      const rowId = Buffer.from(JSON.stringify(data)).toString('base64');
      return rowId === id;
    });`,
  `    const row = rows.find(r => {
      const data = {
        date: r.get('Date') || '',
        description: r.get('Description') || '',
        category: r.get('Category') || '',
        fromAccount: r.get('FromWallet') || '',
        toAccount: r.get('ToWallet') || '',
        amount: r.get('Amount') || '0',
      };
      const rowId = Buffer.from(JSON.stringify(data)).toString('base64');
      if (rowId === id) console.log('FOUND MATCH IN DELETE!');
      return rowId === id;
    });
    if (!row) console.log('NO ROW MATCHED THE ID:', id);
    else console.log('MATCHED ROW:', row.rowNumber);`
);

fs.writeFileSync('lib/google-sheets.ts', file);
