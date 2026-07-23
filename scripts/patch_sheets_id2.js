const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');

file = file.replace(
  `    await sheet.addRow({
      'Date': data.date,
      'Description': data.description,
      'Category': data.category,
      'FromWallet': data.fromAccount || '-',
      'ToWallet': data.toAccount || '-',
      'Amount': data.amount
    });`,
  `    await sheet.addRow({
      'Date': data.date,
      'Description': data.description,
      'Category': data.category,
      'FromWallet': data.fromAccount || '-',
      'ToWallet': data.toAccount || '-',
      'Amount': data.amount,
      'TransactionID': Date.now().toString() + Math.random().toString(36).substr(2, 5)
    });`
);

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
      if (rowId === id) console.log('FOUND MATCH IN DELETE!');
      return rowId === id;
    });
    if (!row) console.log('NO ROW MATCHED THE ID:', id);
    else console.log('MATCHED ROW:', row.rowNumber);`,
  `    const row = rows.find(r => {
      let rowId = r.get('TransactionID');
      if (!rowId) {
        // Fallback for old rows
        const data = {
          date: r.get('Date') || '',
          description: r.get('Description') || '',
          category: r.get('Category') || '',
          fromAccount: r.get('FromWallet') || '',
          toAccount: r.get('ToWallet') || '',
          amount: r.get('Amount') || '0',
        };
        rowId = Buffer.from(JSON.stringify(data)).toString('base64');
      }
      return rowId === id || r.rowNumber.toString() === id;
    });`
);

fs.writeFileSync('lib/google-sheets.ts', file);
