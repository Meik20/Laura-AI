/**
 * fileExtractor.js — Client-side file content extraction
 *
 * PDF  → pdfjs-dist (text layer, no server needed)
 * Image → backend /api/analyze-file (Gemini Vision OCR)
 * Text  → FileReader (direct read)
 */

import * as pdfjsLib from 'pdfjs-dist';

// Point to the PDF.js worker bundled with the package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extract text from a PDF File object using PDF.js (runs in the browser)
 * @param {File} file
 * @returns {Promise<{ text: string|null, pages: number, method: string }>}
 */
async function extractPdfClient(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    const text = fullText.trim();
    if (!text || text.length < 15) {
      return { text: null, pages: numPages, method: 'pdf-js', empty: true };
    }
    return { text, pages: numPages, method: 'pdf-js' };
  } catch (err) {
    console.error('[fileExtractor] PDF.js error:', err);
    return { text: null, pages: 0, method: 'pdf-js', error: err.message };
  }
}

/**
 * Send an image or scanned PDF to the backend for Gemini Vision OCR
 * @param {File} file
 * @param {string} apiBase
 * @returns {Promise<{ text: string|null, method: string }>}
 */
async function extractViaBackend(file, apiBase = '') {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiBase}/api/analyze-file`, {
      method: 'POST',
      body: formData,
    });

    // Check we actually got JSON and not an HTML page
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn('[fileExtractor] Backend not reachable — non-JSON response');
      return { text: null, method: 'backend-unavailable' };
    }

    const data = await response.json();
    if (data.success && data.extractedText) {
      return { text: data.extractedText, method: data.method || 'backend', pages: data.pages };
    }
    return { text: null, method: 'backend', note: data.note || data.error };
  } catch (err) {
    console.warn('[fileExtractor] Backend request failed:', err.message);
    return { text: null, method: 'backend-error', error: err.message };
  }
}

/**
 * Main entry point — extract text from any supported file
 * @param {File} file
 * @param {string} apiBase  — VITE_BACKEND_URL or ''
 * @returns {Promise<{ text: string|null, pages?: number, method: string, status: 'ready'|'no-text'|'error', note?: string }>}
 */
export async function extractFileContent(file, apiBase = '') {
  const type = file.type.toLowerCase();

  // ── PDF: extract client-side first ─────────────────────────────────────
  if (type === 'application/pdf') {
    const result = await extractPdfClient(file);
    if (result.text) {
      return { status: 'ready', text: result.text, pages: result.pages, method: result.method };
    }
    // Scanned PDF — try backend Gemini Vision
    const backendResult = await extractViaBackend(file, apiBase);
    if (backendResult.text) {
      return { status: 'ready', text: backendResult.text, pages: backendResult.pages, method: backendResult.method };
    }
    return {
      status: 'no-text',
      text: null,
      method: 'pdf-scanned',
      note: 'Ce PDF est scanné (pas de couche texte). Prenez une photo de la page et partagez-la en image.'
    };
  }

  // ── Image: send to backend for Gemini Vision OCR ───────────────────────
  if (type.startsWith('image/')) {
    const result = await extractViaBackend(file, apiBase);
    if (result.text) {
      return { status: 'ready', text: result.text, method: result.method };
    }
    if (result.method === 'backend-unavailable') {
      return {
        status: 'no-text',
        text: null,
        method: 'backend-unavailable',
        note: 'Analyse d\'image nécessite le serveur. Décrivez votre exercice dans le chat.',
      };
    }
    return { status: 'no-text', text: null, method: result.method, note: result.note };
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
