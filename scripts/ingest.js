const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * LAURA Ingestion Script
 * Processes PDF documents (Annales, Official Programs) and extracts knowledge
 */

async function ingestPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    const data = await pdf(dataBuffer);
    console.log(`[INGEST] Processed ${filePath} (${data.numpages} pages)`);
    
    // Simple chunking by paragraph for now
    const chunks = data.text.split('\n\n').filter(p => p.trim().length > 100);
    
    return chunks.map((content, index) => ({
      id: `${path.basename(filePath)}_${index}`,
      content: content.trim(),
      source: path.basename(filePath),
      metadata: {
        page: 'extracted',
        type: 'official_document'
      }
    }));
  } catch (error) {
    console.error(`[ERROR] Failed to process ${filePath}:`, error.message);
    return [];
  }
}

async function main() {
  const dataDir = path.join(__dirname, '../data/corpus');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log('[INFO] Aucun fichier PDF trouvé dans /data/corpus. Dépose tes annales ici !');
    return;
  }

  let allKnowledge = [];
  for (const file of files) {
    const knowledge = await ingestPDF(path.join(dataDir, file));
    allKnowledge = [...allKnowledge, ...knowledge];
  }

  // Update knowledge.json (for MVP)
  const currentKnowledge = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/knowledge.json'), 'utf8'));
  const updatedKnowledge = [...currentKnowledge, ...allKnowledge];
  
  fs.writeFileSync(
    path.join(__dirname, '../data/knowledge.json'), 
    JSON.stringify(updatedKnowledge, null, 2)
  );
  
  console.log(`[SUCCESS] Base de connaissances mise à jour : ${allKnowledge.length} nouveaux fragments ajoutés.`);
}

main();
