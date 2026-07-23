const fs = require('fs');
let code = fs.readFileSync('lib/google-sheets.ts', 'utf8');

const newAuthLogic = `    let email = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // Check if the user uploaded a service account JSON file
    try {
      const fs = require('fs');
      const path = require('path');
      const files = fs.readdirSync(process.cwd());
      const jsonFile = files.find(f => f.endsWith('.json') && f.includes('env'));
      
      if (jsonFile) {
        const content = fs.readFileSync(path.join(process.cwd(), jsonFile), 'utf8');
        const parsed = JSON.parse(content);
        if (parsed.client_email && parsed.private_key) {
          email = parsed.client_email;
          privateKey = parsed.private_key;
        }
      }
    } catch (e) {
      console.error('Error reading json service account:', e);
    }

    if (privateKey) {`;

code = code.replace(/    let email = process\.env\.GOOGLE_CLIENT_EMAIL(?:.|\n)*?    if \(privateKey\) \{/, newAuthLogic);

fs.writeFileSync('lib/google-sheets.ts', code);
