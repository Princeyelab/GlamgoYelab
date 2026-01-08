const fs = require('fs');
const path = require('path');

const SERVICES_FILE = path.join(__dirname, '../src/i18n/translations/services.ts');
const content = fs.readFileSync(SERVICES_FILE, 'utf8');

// Extract all service names
const servicePattern = /'([^']+)':\s*{\s*title:/g;
let match;
const services = [];
while ((match = servicePattern.exec(content)) !== null) {
  services.push(match[1]);
}

console.log(`\nTotal services trouvés: ${services.length}\n`);

// Check each service for missing German translations
const missing = [];
services.forEach(service => {
  const serviceRegex = new RegExp(`'${service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:[\\s\\S]*?}\\s*},?`, 'g');
  const serviceBlock = content.match(serviceRegex);
  if (serviceBlock && serviceBlock[0]) {
    const block = serviceBlock[0];
    // Count 'de:' occurrences (should be 2: title and description)
    const deCount = (block.match(/de:/g) || []).length;
    if (deCount < 2) {
      const hasTitleDE = block.match(/title:[^}]*de:/);
      const hasDescDE = block.match(/description:[^}]*de:/);
      missing.push({
        service,
        missingTitle: !hasTitleDE,
        missingDesc: !hasDescDE
      });
    }
  }
});

console.log('Services manquant de traductions allemandes:\n');
missing.forEach(item => {
  console.log(`- ${item.service}`);
  if (item.missingTitle) console.log('  ❌ Titre manquant');
  if (item.missingDesc) console.log('  ❌ Description manquante');
});

console.log(`\nTotal: ${missing.length} services incomplets`);
