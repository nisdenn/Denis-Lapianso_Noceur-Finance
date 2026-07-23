const fs = require('fs');
let file = fs.readFileSync('lib/google-sheets.ts', 'utf8');

file = file.replace(
  "const headers = ['Date', 'Description', 'Category', 'FromWallet', 'ToWallet', 'Amount'];",
  "const headers = ['Date', 'Description', 'Category', 'FromWallet', 'ToWallet', 'Amount', 'TransactionID'];"
);

file = file.replace(
  `    await sheet.loadHeaderRow();
    if (sheet.headerValues.includes('Tanggal')) {
      await sheet.setHeaderRow(headers);
    }`,
  `    await sheet.loadHeaderRow();
    if (sheet.headerValues.includes('Tanggal') || !sheet.headerValues.includes('TransactionID')) {
      await sheet.setHeaderRow(headers);
    }`
);

file = file.replace(
  `    const rows = await sheet.getRows();
    return rows.map((row) => {
      const data = {
        date: row.get('Date') || '',
        description: row.get('Description') || '',
        category: row.get('Category') || '',
        fromAccount: row.get('FromWallet') || '',
        toAccount: row.get('ToWallet') || '',
        amount: row.get('Amount') || '0',
      };
      // Create a stable, unique ID based on the content
      const id = Buffer.from(JSON.stringify(data)).toString('base64');
      
      return {
        id,
        date: data.date,
        description: data.description,
        category: data.category as any,
        fromAccount: data.fromAccount,
        toAccount: data.toAccount,
        amount: parseFloat(data.amount)
      };
    }).reverse();`,
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
    }).reverse();`
);

fs.writeFileSync('lib/google-sheets.ts', file);
