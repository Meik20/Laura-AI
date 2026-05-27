const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * LAURA Ingestion Script
 * Processes PDF documents (Annales, Official Programs) and extracts knowledge
 */

async function ingestPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  
  try {
    const data = await pdf(dataBuffer);
    console.log(`[INGEST] Structuration de ${fileName}...`);
    
    // On découpe par page pour garantir la traçabilité de page_ref
    const pages = data.text.split('\f'); // Form feed character for pages
    const knowledgeChunks = [];

    pages.forEach((content, pageIdx) => {
      if (content.trim().length < 100) return;

      const pageNum = pageIdx + 1;
      
      knowledgeChunks.push({
        id: `${fileName.replace(/\.[^/.]+$/, "")}_p${pageNum}`,
        source: "MINESEC/GCE_BOARD", // À affiner via meta-data
        type: "manuel", 
        exam: fileName.includes('BAC') ? "BAC" : "GCE_O",
        series: null,
        year: 2024,
        subject: "Général",
        level: "Terminale",
        subsystem: "francophone",
        language: "fr",
        region: "national",
        content: content.trim(),
        answer: null,
        page_ref: `p.${pageNum}`,
        verified: true,
        embedding_model: "multilingual-e5-large",
        ingested_at: new Date().toISOString()
      });
    });

    return knowledgeChunks;
  } catch (error) {
    console.error(`[ERROR] Échec de la structuration de ${fileName}:`, error.message);
    return [];
  }
}

const Tesseract = require('tesseract.js');
const rag = require('../server/services/rag');

async function ingestImage(filePath) {
  console.log(`[OCR] Processing image: ${filePath}`);
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'fra+eng');
    const chunks = text.split('\n\n').filter(p => p.trim().length > 50);
    return chunks.map((content, index) => ({
      id: `ocr_${path.basename(filePath)}_${index}`,
      content: content.trim(),
      source: path.basename(filePath),
      metadata: { type: 'scanned_manual' }
    }));
  } catch (error) {
    console.error(`[ERROR] OCR failed for ${filePath}:`, error.message);
    return [];
  }
}

async function main() {
  const dataDir = path.join(__dirname, '../data/corpus');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const files = fs.readdirSync(dataDir);
  
  for (const file of files) {
    let knowledge = [];
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(dataDir, file);

    if (ext === '.pdf') {
      knowledge = await ingestPDF(filePath);
    } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      knowledge = await ingestImage(filePath);
    }

    if (knowledge.length > 0) {
      await rag.addDocuments(knowledge);
    }
  }

  console.log(`[SUCCESS] Ingestion terminée.`);
}

main();
