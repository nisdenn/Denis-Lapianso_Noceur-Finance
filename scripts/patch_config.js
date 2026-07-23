const fs = require('fs');
let file = fs.readFileSync('next.config.mjs', 'utf8');

file = file.replace(
  "serverExternalPackages: ['google-auth-library', 'google-spreadsheet']",
  "serverComponentsExternalPackages: ['google-auth-library', 'google-spreadsheet']"
);

file = file.replace(
  "serverComponentsExternalPackages",
  "experimental: { serverComponentsExternalPackages: ['google-auth-library', 'google-spreadsheet'] }"
);

fs.writeFileSync('next.config.mjs', file);
