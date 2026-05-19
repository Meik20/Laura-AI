/**
 * fileParser.js — Extract text from uploaded files (PDF, images)
 * 
 * Strategy:
 *   - PDF  → pdf-parse (text layer extraction)
 *   - Image → Tesseract.js (OCR) or Gemini Vision (if Google key available)
 *   - DOC/DOCX → basic binary text extraction (fallback)
 */

const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const googleKey = (process.env.GOOGLE_AI_API_KEY || '').trim();
const genAI = googleKey ? new GoogleGenerativeAI(googleKey) : null;

/**
 * Convert an image buffer to base64 data URI
 */
function bufferToBase64(buffer, mimeType) {
  return buffer.toString('base64');
}

/**
 * Extract text from a PDF buffer using pdf-parse
 */
async function extractPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text?.trim();
    if (!text || text.length < 20) {
      return { text: null, method: 'pdf-parse', empty: true };
    }
    return { text, method: 'pdf-parse', pages: data.numpages };
  } catch (err) {
    console.error('[fileParser] pdf-parse error:', err.message);
    return { text: null, method: 'pdf-parse', error: err.message };
  }
}

/**
 * Extract text from an image using Gemini Vision (preferred) or Tesseract OCR
 */
async function extractImage(buffer, mimeType) {
  // Try Gemini Vision first (better quality for handwritten exercises)
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const base64 = bufferToBase64(buffer, mimeType);
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        },
        'Transcris intégralement et fidèlement tout le texte visible dans cette image. ' +
        'Si c\'est un exercice scolaire ou un document mathématique, retranscris chaque question, ' +
        'formule, chiffre et instruction avec précision. Ne reformule pas, transcris simplement.',
      ]);
      const text = result.response.text()?.trim();
      if (text && text.length > 10) {
        return { text, method: 'gemini-vision' };
      }
    } catch (err) {
      console.warn('[fileParser] Gemini Vision failed, trying Tesseract:', err.message);
    }
  }

  // Fallback: Tesseract.js OCR
  try {
    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(buffer, 'fra+eng', {
      logger: () => {}, // suppress progress logs
    });
    if (text?.trim()) {
      return { text: text.trim(), method: 'tesseract-ocr' };
    }
  } catch (err) {
    console.error('[fileParser] Tesseract OCR error:', err.message);
  }

  return { text: null, method: 'none', error: 'Could not extract text from image' };
}

/**
 * Main dispatcher — analyze a file buffer and return extracted text
 * @param {Buffer} buffer
 * @param {string} mimeType - e.g. 'application/pdf', 'image/jpeg'
 * @param {string} originalName
 * @returns {Promise<{ text: string|null, method: string, pages?: number }>}
 */
async function analyzeFile(buffer, mimeType, originalName) {
  const type = mimeType.toLowerCase();

  if (type === 'application/pdf') {
    const result = await extractPDF(buffer);
    // If PDF has no text layer (scanned PDF), try OCR via Gemini
    if (result.empty && genAI) {
      console.log('[fileParser] Scanned PDF detected, trying Gemini Vision on first page...');
      // For scanned PDFs without text, we return the empty result
      // Full image-based PDF OCR requires a separate library (pdf2pic etc.) — not in scope
      return { ...result, note: 'PDF appears to be scanned (no text layer). Please share a text-based PDF or take a photo of the page.' };
    }
    return result;
  }

  if (type.startsWith('image/')) {
    return extractImage(buffer, mimeType);
  }

  // Plain text fallback
  if (type.startsWith('text/')) {
    return { text: buffer.toString('utf-8'), method: 'plaintext' };
  }

  return { text: null, method: 'unsupported', error: `File type ${mimeType} not supported` };
}

/**
 * Perform OCR on an array of base64 images using Gemini Vision (fallback to Tesseract)
 */
async function analyzeBase64Images(inlineDataArray) {
  let geminiFailed = false;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Transcris intégralement et fidèlement tout le texte visible dans ce document/cette image. Si c\'est un exercice scolaire ou un document mathématique, retranscris chaque question, formule, chiffre et instruction avec précision. Ne reformule pas, transcris simplement.';
      
      const result = await model.generateContent([
        ...inlineDataArray.map(item => ({
          inlineData: { data: item.base64, mimeType: item.mimeType || 'image/jpeg' }
        })),
        prompt
      ]);

      const text = result.response.text()?.trim();
      if (text && text.length > 10) {
        return { text, method: 'gemini-vision-backend' };
      }
    } catch (err) {
      console.warn('[fileParser] Gemini analyzeBase64Images error:', err.message);
      geminiFailed = true;
    }
  } else {
    geminiFailed = true;
  }

  // Fallback to Tesseract.js if Gemini is unavailable or failed
  if (geminiFailed) {
    console.log('[fileParser] Falling back to Tesseract OCR for base64 images...');
    try {
      const Tesseract = require('tesseract.js');
      let fullText = '';
      
      for (const item of inlineDataArray) {
        // Tesseract recognizes base64 URIs
        const dataUri = `data:${item.mimeType || 'image/jpeg'};base64,${item.base64}`;
        const { data: { text } } = await Tesseract.recognize(dataUri, 'fra+eng', {
          logger: () => {}, 
        });
        fullText += text + '\n\n';
      }

      const finalText = fullText.trim();
      if (finalText.length > 10) {
        return { text: finalText, method: 'tesseract-ocr-backend' };
      }
      return { text: null, method: 'tesseract-ocr-backend', note: 'Aucun texte n\'a pu être identifié par Tesseract.' };
    } catch (err) {
      console.error('[fileParser] Tesseract error:', err.message);
      return { text: null, method: 'ocr-error', note: 'Tesseract: ' + err.message };
    }
  }

  return { text: null, method: 'gemini-vision-backend', note: 'Aucun texte n\'a pu être identifié.' };
}

module.exports = { analyzeFile, analyzeBase64Images };
