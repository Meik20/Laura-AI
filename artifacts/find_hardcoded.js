const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, '..', 'client', 'src', 'pages', 'learn'),
  path.join(__dirname, '..', 'client', 'src', 'pages', 'tutor'),
  path.join(__dirname, '..', 'client', 'src', 'layouts')
];

const results = [];

// Match JSX text nodes that contain French characters/words but are not i18n variables.
// E.g., strings like >Bonjour<, placeholder="Entrez votre nom"
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    // Look for JSX text: >something< where something has french-like letters
    // Avoid scripts, imports, comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('import')) return;
    
    // Simple checks for common French words that might be hardcoded in tags or quotes
    const frenchWords = [
      'Bonjour', 'Erreur', 'Félicitations', 'Modifier', 'Supprimer', 'Enregistrer', 'Annuler',
      'Soumettre', 'Fermer', 'Suivant', 'Précédent', 'Retour', 'Matière', 'Niveau', 'Série',
      'Examen', 'Tuteur', 'Apprenant', 'Élève', 'Étudiant', 'Lycee', 'College', 'Classe',
      'Optionnel', 'Titre', 'Description', 'Contenu', 'Brouillon', 'Soumission', 'Communauté',
      'Rejoindre', 'Demander', 'Attente', 'Refusé', 'Bienvenue', 'Rechercher', 'Créer', 'Sauvegarde'
    ];
    
    frenchWords.forEach(word => {
      // Check if word is present in a string literal or JSX text but not in a translation key call
      // E.g. word is present and not matching t('...word...')
      const regex = new RegExp(`(?<!t\\(\\s*['"][^'"]*)${word}`, 'i');
      if (regex.test(line)) {
        // Exclude console.errors and comments
        if (line.includes('console.error') || line.includes('console.log')) return;
        results.push({
          file: path.relative(path.join(__dirname, '..'), filePath),
          line: idx + 1,
          content: trimmed,
          word
        });
      }
    });
  });
}

function walkDir(dir) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.jsx')) {
      auditFile(fullPath);
    }
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
});

console.log(`Found ${results.length} possible hardcoded texts:`);
console.log(JSON.stringify(results.slice(0, 100), null, 2));
