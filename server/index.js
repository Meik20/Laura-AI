const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const orchestrator = require('./services/orchestrator');
const ussdService = require('./services/ussd');
const fileParser = require('./services/fileParser');
const checkAuth = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');

// Multer — in-memory storage for file upload analysis
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
    }
  }
});

// Middleware - CSP configured for React SPA (Vite builds use inline scripts and modules)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://laura-ai-production.up.railway.app",
        "https://laura-ai-lake.vercel.app",
        "https://firebaseapp.com",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://*.firebase.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
      ],
    },
  },
}));

const ALLOWED_ORIGINS = [
  'https://laura-ai-lake.vercel.app',
  'https://laura-ai.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Explicit preflight handler — required for multipart/form-data (file uploads)
app.options(/.*/, cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS preflight: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes Placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', project: 'LAURA', version: '1.2.0' });
});

// Rate Limiter instances for serverless security
const chatLimiter = rateLimiter({ windowMs: 60 * 1000, max: 10, message: "Trop de messages envoyés. Veuillez attendre une minute." });
const ocrLimiter = rateLimiter({ windowMs: 60 * 1000, max: 5, message: "Trop de fichiers analysés. Veuillez attendre une minute." });
const ussdLimiter = rateLimiter({ windowMs: 60 * 1000, max: 30, message: "Limitation USSD dépassée. Réessayez plus tard." });

// USSD Gateway Route (Africa's Talking / Maviance Standard)
app.post('/api/ussd', ussdLimiter, async (req, res) => {
  const { phoneNumber, text, sessionId } = req.body;
  
  // Verify USSD incoming signature token to prevent spoofing
  const ussdToken = req.query.token || req.headers['x-ussd-token'];
  const expectedToken = process.env.USSD_SECRET;
  if (expectedToken && ussdToken !== expectedToken) {
    console.warn(`[SECURITY WARNING] Blocked unauthorized USSD callback request.`);
    return res.status(401).send("END Accès non autorisé.");
  }
  
  try {
    const response = await ussdService.handleRequest(phoneNumber, text, sessionId);
    res.send(response);
  } catch (error) {
    console.error('USSD error:', error);
    res.send("END Erreur technique. Réessayez.");
  }
});

// File Analysis Route — extract text from PDF/image
app.post('/api/analyze-file', checkAuth, ocrLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  const { buffer, mimetype, originalname } = req.file;
  console.log(`[LAURA] Analyzing file: ${originalname} (${mimetype}, ${(buffer.length / 1024).toFixed(1)} Ko)`);

  try {
    const result = await fileParser.analyzeFile(buffer, mimetype, originalname);

    if (result.text) {
      return res.json({
        success: true,
        extractedText: result.text,
        method: result.method,
        pages: result.pages || null,
        fileName: originalname,
      });
    } else {
      return res.json({
        success: false,
        extractedText: null,
        method: result.method,
        note: result.note || result.error || 'Impossible d\'extraire le texte de ce fichier.',
        fileName: originalname,
      });
    }
  } catch (err) {
    console.error('[analyze-file] Error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'analyse du fichier.' });
  }
});

// Base64 OCR Route — for client-side rendered PDF pages
app.post('/api/analyze-base64', checkAuth, ocrLimiter, async (req, res) => {
  const { inlineDataArray } = req.body;
  if (!inlineDataArray || !Array.isArray(inlineDataArray)) {
    return res.status(400).json({ error: 'Données invalides.' });
  }

  console.log(`[LAURA] Analyzing ${inlineDataArray.length} base64 images via Gemini Vision`);

  try {
    const result = await fileParser.analyzeBase64Images(inlineDataArray);
    if (result.text) {
      return res.json({ success: true, extractedText: result.text, method: result.method });
    }
    return res.json({ success: false, extractedText: null, method: result.method, note: result.note || 'Impossible d\'extraire le texte.' });
  } catch (err) {
    console.error('[analyze-base64] Error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'analyse des images.' });
  }
});

// AI Orchestration Route
app.post('/api/chat', checkAuth, chatLimiter, async (req, res) => {
  const { message, mode, userContext, history, documentContext } = req.body;
  
  try {
    const result = await orchestrator.handleChat(message, userContext, mode, history, documentContext);
    res.json(result);
  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(500).json({ error: 'LAURA rencontre une difficulté technique.' });
  }
});

// CORS-safe error handler — ensures CORS headers are present even on errors
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.error('[LAURA Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

// Serve Frontend in Production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res) => {
  // API 404 — return JSON, not HTML
  if (req.path.startsWith('/api/')) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return res.status(404).json({ error: `Route not found: ${req.path}` });
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

if (!process.env.VERCEL && !process.env.NOW_REGION) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LAURA Server running on port ${PORT}`);
  });
}

module.exports = app;
