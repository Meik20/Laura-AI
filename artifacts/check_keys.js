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

const directories = [
  path.join(__dirname, '..', 'client', 'src', 'pages', 'learn'),
  path.join(__dirname, '..', 'client', 'src', 'pages', 'tutor'),
  path.join(__dirname, '..', 'client', 'src', 'layouts')
];

const tCallRegex = /t\(\s*['"]([^'"]+)['"]/g;
const missingKeys = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    const inFr = hasKey(fr, key);
    const inEn = hasKey(en, key);
    if (!inFr || !inEn) {
      missingKeys.push({
        file: path.relative(path.join(__dirname, '..'), filePath),
        key,
        inFr,
        inEn
      });
    }
  }
}

function walkDir(dir) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      checkFile(fullPath);
    }
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log("Missing keys analysis:");
console.log(JSON.stringify(missingKeys, null, 2));
