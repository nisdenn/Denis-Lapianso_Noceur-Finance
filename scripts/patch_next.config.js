const fs = require('fs');
let file = fs.readFileSync('next.config.mjs', 'utf8');
file = file.replace(
  "  serverComponentsExternalPackages: ['google-auth-library', 'google-spreadsheet'],",
  "  experimental: { serverComponentsExternalPackages: ['google-auth-library', 'google-spreadsheet'] },"
);
fs.writeFileSync('next.config.mjs', file);
