const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'fr', 'translation.json');
const enPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'en', 'translation.json');

// Read raw text to get all keys, even duplicate ones (which JSON.parse overwrites).
// We will parse the files. But wait, for French, we want to extract values of keys.
// Let's write a simple parser or just load both.
// Actually, in the French file, since JSON.parse(fs.readFileSync(...)) compiled, we can load it.
// Wait, if JSON.parse overwrites duplicate keys, we might lose the first occurrence (like nav.login).
// Let's check: did French translation.json have root-level "nav" containing "login", "signup", etc.?
// Yes, at lines 29-35:
// "nav": {
//   "how_it_works": "Comment ça marche",
//   "become_tutor": "Devenez tuteur",
//   ...
// And then at line 1190:
// "nav": {
//   "overview": "Vue Globale",
//   ...
// If we do JSON.parse(frRaw), the second "nav" (line 1190) overwrites the first!
// So we lose "how_it_works", "become_tutor", etc.!
// To prevent this, we should parse the FR JSON using a parser that doesn't overwrite,
// or we can read it line-by-line, or we can just parse the file textually.
// Let's write a regex-based parser that extracts all leaf keys and their values from the raw JSON!

function extractKeysAndValues(jsonStr) {
  const map = {};
  const stack = [];
  
  // We can tokenise the JSON or use a line-by-line regex.
  // Since translation.json is formatted with one key-value per line:
  const lines = jsonStr.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check if it's a closing bracket
    if (line.startsWith('}') || line.startsWith('},')) {
      stack.pop();
      continue;
    }
    
    // Match key-value: "key": "value",
    const kvMatch = line.match(/^"([^"]+)"\s*:\s*"(.*)",?$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2];
      const fullKey = [...stack, key].join('.');
      map[fullKey] = val;
      continue;
    }
    
    // Match key-object start: "key": {
    const objMatch = line.match(/^"([^"]+)"\s*:\s*\{$/);
    if (objMatch) {
      const key = objMatch[1];
      stack.push(key);
      continue;
    }
  }
  return map;
}

const frRaw = fs.readFileSync(frPath, 'utf8');
const enRaw = fs.readFileSync(enPath, 'utf8');

const frMap = extractKeysAndValues(frRaw);
const enMap = extractKeysAndValues(enRaw);

console.log("Extracted FR keys count:", Object.keys(frMap).length);
console.log("Extracted EN keys count:", Object.keys(enMap).length);

// Let's see some extracted keys:
console.log("Sample FR keys:");
console.log(Object.keys(frMap).slice(0, 10).map(k => `${k} => ${frMap[k]}`));

// Now let's build the aligned French JSON based on the English structure.
const enJson = JSON.parse(enRaw);

function alignObject(enObj, currentPath = '') {
  const result = {};
  for (let key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      result[key] = alignObject(enObj[key], fullPath);
    } else {
      // Find value in frMap
      // We look for fullPath, e.g. "admin.dashboard.hello"
      // If not found, we also look for the path without "admin." prefix if fullPath starts with "admin."
      let frVal = frMap[fullPath];
      if (frVal === undefined && fullPath.startsWith('admin.')) {
        const alternativePath = fullPath.substring(6); // remove "admin."
        frVal = frMap[alternativePath];
      }
      
      if (frVal !== undefined) {
        result[key] = frVal;
      } else {
        // Fallback to English value
        result[key] = enObj[key];
        console.log(`Missing French translation for: ${fullPath}, using English fallback: "${enObj[key]}"`);
      }
    }
  }
  return result;
}

const alignedFr = alignObject(enJson);

// Save the aligned French file!
fs.writeFileSync(frPath, JSON.stringify(alignedFr, null, 2), 'utf8');
console.log("French translation aligned and saved!");
