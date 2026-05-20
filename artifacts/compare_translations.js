const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'fr', 'translation.json');
const enPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'en', 'translation.json');

const frRaw = fs.readFileSync(frPath, 'utf8');
const enRaw = fs.readFileSync(enPath, 'utf8');

// Parse but also track if there are duplicate keys since JSON.parse just overwrites them.
// We can write a custom function to find duplicate keys.
function findDuplicateKeys(jsonStr) {
  const keys = [];
  const duplicates = [];
  
  // Very basic JSON key finder using regex
  const keyRegex = /"([^"]+)"\s*:/g;
  let match;
  while ((match = keyRegex.exec(jsonStr)) !== null) {
    const key = match[1];
    if (keys.includes(key)) {
      duplicates.push(key);
    } else {
      keys.push(key);
    }
  }
  return duplicates;
}

console.log("FR duplicates:", findDuplicateKeys(frRaw).filter(k => k !== 'title' && k !== 'subtitle' && k !== 'desc' && k !== 'status' && k !== 'table' && k !== 'actions' && k !== 'modal' && k !== 'loading' && k !== 'empty' && k !== 'success' && k !== 'error' && k !== 'saving' && k !== 'save_btn' && k !== 'close' && k !== 'type' && k !== 'subject' && k !== 'level' && k !== 'date' && k !== 'name' && k !== 'confirm_delete' && k !== 'error_delete' && k !== 'error_save' && k !== 'submit'));

const fr = JSON.parse(frRaw);
const en = JSON.parse(enRaw);

function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const frKeys = getKeys(fr);
const enKeys = getKeys(en);

console.log(`FR total keys: ${frKeys.length}`);
console.log(`EN total keys: ${enKeys.length}`);

const missingInEn = frKeys.filter(k => !enKeys.includes(k));
const missingInFr = enKeys.filter(k => !frKeys.includes(k));

console.log("\nKeys in FR but missing in EN:");
console.log(missingInEn);

console.log("\nKeys in EN but missing in FR:");
console.log(missingInFr);
