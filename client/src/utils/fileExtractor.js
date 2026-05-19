/**
 * fileExtractor.js — Client-side file content extraction
 *
 * PDF  → pdfjs-dist (text layer, no server needed)
 * Image → backend /api/analyze-file (Gemini Vision OCR)
 * Text  → FileReader (direct read)
 */

import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Point to the PDF.js worker bundled with the package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
});

async function renderPdfPageToBase64(page) {
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

async function extractViaGeminiVision(inlineDataArray) {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  if (!apiKey) return { text: null, method: 'gemini-missing-key', note: "La clé API Gemini n'est pas configurée côté client." };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'Transcris intégralement et fidèlement tout le texte visible dans cette image/ce document. Si c\'est un exercice scolaire ou un document mathématique, retranscris chaque question, formule, chiffre et instruction avec précision. Ne reformule pas, transcris simplement.';

    const result = await model.generateContent([
      ...inlineDataArray.map(data => ({
        inlineData: { data: data.base64, mimeType: data.mimeType }
      })),
      prompt
    ]);

    const text = result.response.text()?.trim();
    if (text && text.length > 10) {
      return { text, method: 'gemini-vision-client' };
    }
    return { text: null, method: 'gemini-vision-client', note: 'Texte introuvable dans le document.' };
  } catch (err) {
    console.error('[Gemini Vision Client Error]', err);
    return { text: null, method: 'gemini-vision-error', error: err.message };
  }
}

/**
 * Main entry point — extract text from any supported file
 * @param {File} file
 * @param {string} apiBase  — Ignored, backend is no longer needed
 * @returns {Promise<{ text: string|null, pages?: number, method: string, status: 'ready'|'no-text'|'error', note?: string }>}
 */
export async function extractFileContent(file, apiBase = '') {
  const type = file.type.toLowerCase();

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let fullText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n\n';
      }

      const text = fullText.trim();
      // If native text is sufficient, return it
      if (text && text.length >= 15) {
        return { status: 'ready', text, pages: numPages, method: 'pdf-js' };
      }

      // ── Scanned PDF (CamScanner) → Render to images & use Gemini Vision ──
      console.log('[fileExtractor] PDF scanné détecté. Rendu via Canvas + Gemini Vision OCR...');
      const maxPagesToOcr = Math.min(numPages, 5); // Limit to 5 pages to save payload size / API limits
      const inlineDataArray = [];

      for (let i = 1; i <= maxPagesToOcr; i++) {
        const page = await pdf.getPage(i);
        const base64 = await renderPdfPageToBase64(page);
        inlineDataArray.push({ base64, mimeType: 'image/jpeg' });
      }

      const geminiResult = await extractViaGeminiVision(inlineDataArray);
      if (geminiResult.text) {
        return { status: 'ready', text: geminiResult.text, pages: numPages, method: geminiResult.method };
      }

      return {
        status: 'no-text',
        text: null,
        method: 'pdf-scanned-ocr-failed',
        note: 'Impossible de lire le document scanné. Veuillez prendre une photo claire ou copier le texte.',
      };
    } catch (err) {
      console.error('[fileExtractor] PDF error:', err);
      return { status: 'error', text: null, method: 'pdf-error', note: err.message };
    }
  }

  // ── Image ────────────────────────────────────────────────────────────────
  if (type.startsWith('image/')) {
    try {
      const base64 = await fileToBase64(file);
      const geminiResult = await extractViaGeminiVision([{ base64, mimeType: type }]);
      
      if (geminiResult.text) {
        return { status: 'ready', text: geminiResult.text, method: geminiResult.method };
      }
      return { status: 'no-text', text: null, method: geminiResult.method, note: geminiResult.note };
    } catch (err) {
      return { status: 'error', text: null, method: 'image-error', note: err.message };
    }
  }

  // ── Plain text ──────────────────────────────────────────────────────────
  if (type.startsWith('text/')) {
    try {
      const text = await file.text();
      return { status: 'ready', text, method: 'plaintext' };
    } catch (err) {
      return { status: 'error', text: null, method: 'plaintext', note: err.message };
    }
  }

  return { status: 'error', text: null, method: 'unsupported', note: `Type de fichier non supporté: ${file.type}` };
}
