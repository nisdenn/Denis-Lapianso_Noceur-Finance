const fs = require('fs');
const files = fs.readdirSync('/tmp').filter(f => f.endsWith('.log'));
for (const f of files) {
  const content = fs.readFileSync('/tmp/' + f, 'utf8');
  if (content.includes('removeTransactionAction')) {
    console.log('--- FOUND IN', f, '---');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('removeTransactionAction')) {
        console.log(lines.slice(Math.max(0, i-2), i+3).join('\n'));
      }
    }
  }
}
