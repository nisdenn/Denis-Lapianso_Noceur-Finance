const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/settings/page.tsx', 'utf8');

const newLogic = `
  let serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "Service Account Email Not Configured";
  try {
    const fs = require('fs');
    const path = require('path');
    const files = fs.readdirSync(process.cwd());
    const jsonFile = files.find(f => f.endsWith('.json') && f.includes('env'));
    
    if (jsonFile) {
      const content = fs.readFileSync(path.join(process.cwd(), jsonFile), 'utf8');
      const parsed = JSON.parse(content);
      if (parsed.client_email) {
        serviceAccountEmail = parsed.client_email;
      }
    }
  } catch (e) {}
`;

code = code.replace(/  const serviceAccountEmail = [^;]+;/, newLogic);

code = code.replace(/Copy the Sheet ID from the URL and paste it below\./, 'Copy the full URL link or the Sheet ID and paste it below.');
code = code.replace(/<label className="block text-sm font-bold text-slate-800 mb-1">Your Google Sheet ID<\/label>/, '<label className="block text-sm font-bold text-slate-800 mb-1">Your Google Sheet Link or ID</label>');
code = code.replace(/placeholder="Paste Sheet ID here"/, 'placeholder="Paste Sheet Link or ID here"');
code = code.replace(/Save Sheet ID<\/button>/, 'Save Sheet</button>');
code = code.replace(/Example: 1BxiMVs0XRYFgwn\.\.\./, 'Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRYFgwn...');

fs.writeFileSync('app/(dashboard)/settings/page.tsx', code);
