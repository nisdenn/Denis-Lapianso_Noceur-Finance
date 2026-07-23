const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');

file = file.replace(
  `    const rows = await sheet.getRows();
    return rows.map((row) => {
      let id = row.get('TransactionID');
      if (!id) {
        // Fallback for old rows
        const data = {
          date: row.get('Date') || '',
          description: row.get('Description') || '',
          category: row.get('Category') || '',
          fromAccount: row.get('FromWallet') || '',
          toAccount: row.get('ToWallet') || '',
          amount: row.get('Amount') || '0',
        };
        id = Buffer.from(JSON.stringify(data)).toString('base64');
      }
      
      return {
        id,
        date: row.get('Date') || '',
        description: row.get('Description') || '',
        category: row.get('Category') as any,
        fromAccount: row.get('FromWallet') || '',
        toAccount: row.get('ToWallet') || '',
        amount: parseFloat(row.get('Amount') || '0')
      };
    }).reverse();`,
  `    const rows = await sheet.getRows();
    return rows.map((row) => {
      let id = row.get('TransactionID');
      if (!id) {
        id = row.rowNumber.toString();
      }
      
      return {
        id,
        date: row.get('Date') || '',
        description: row.get('Description') || '',
        category: row.get('Category') as any,
        fromAccount: row.get('FromWallet') || '',
        toAccount: row.get('ToWallet') || '',
        amount: parseFloat(row.get('Amount') || '0')
      };
    }).reverse();`
);

file = file.replace(
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
    });`,
  `    const row = rows.find(r => {
      let rowId = r.get('TransactionID');
      if (!rowId) {
        rowId = r.rowNumber.toString();
      }
      return rowId === id || r.rowNumber.toString() === id;
    });`
);

fs.writeFileSync('lib/google-sheets.ts', file);
