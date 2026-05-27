/**
 * fileExtractor.js — Client-side file content extraction
 *
 * PDF  → pdfjs-dist (text layer, no server needed)
 * Image → backend /api/analyze-file (Gemini Vision OCR)
 * Text  → FileReader (direct read)
 */

import * as pdfjsLib from 'pdfjs-dist';
import { auth } from '../firebase';

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

async function extractViaBackendBase64(inlineDataArray, apiBase = '') {
  try {
    const headers = { 'Content-Type': 'application/json' };
    
    // Inject Firebase ID Token for security checks
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}/api/analyze-base64`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inlineDataArray })
    });

    // Check we actually got JSON and not an HTML page
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn('[fileExtractor] Backend not reachable — non-JSON response');
      return { text: null, method: 'backend-unavailable', note: "Le serveur d'analyse est injoignable." };
    }

    const data = await response.json();
    if (data.success && data.extractedText) {
      return { text: data.extractedText, method: data.method || 'backend-base64' };
    }
    return { text: null, method: 'backend-base64', note: data.note || data.error };
  } catch (err) {
    console.warn('[fileExtractor] Backend request failed:', err.message);
    return { text: null, method: 'backend-error', note: err.message };
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

      const geminiResult = await extractViaBackendBase64(inlineDataArray, apiBase);
      if (geminiResult.text) {
        return { status: 'ready', text: geminiResult.text, pages: numPages, method: geminiResult.method };
      }

      return {
        status: 'no-text',
        text: null,
        method: 'pdf-scanned-ocr-failed',
        note: geminiResult.note || 'Impossible de lire le document scanné. Veuillez prendre une photo claire ou copier le texte.',
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
      const geminiResult = await extractViaBackendBase64([{ base64, mimeType: type }], apiBase);
      
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
