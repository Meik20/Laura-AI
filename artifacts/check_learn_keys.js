const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'fr', 'translation.json');
const enPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'en', 'translation.json');

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function hasKey(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let part of parts) {
    if (current === null || typeof current !== 'object') return false;
    current = current[part];
  }
  return current !== undefined;
}

const learnDir = path.join(__dirname, '..', 'client', 'src', 'pages', 'learn');
const files = fs.readdirSync(learnDir);

const tCallRegex = /t\(\s*['"]([^'"]+)['"]/g;
const missing = [];

files.forEach(file => {
  if (!file.endsWith('.jsx')) return;
  const filePath = path.join(learnDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    const inFr = hasKey(fr, key);
    const inEn = hasKey(en, key);
    if (!inFr || !inEn) {
      missing.push({ file, key, inFr, inEn });
    }
  }
});

console.log("Missing keys in learn directory:");
console.log(JSON.stringify(missing, null, 2));
