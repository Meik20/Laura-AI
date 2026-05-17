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

// Middleware - CSP configured for React SPA (Vite builds use inline scripts and modules)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://firebaseapp.com", "https://*.googleapis.com", "https://*.firebaseio.com"],
    },
  },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes Placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', project: 'LAURA', version: '1.2.0' });
});

// USSD Gateway Route (Africa's Talking / Maviance Standard)
app.post('/api/ussd', async (req, res) => {
  const { phoneNumber, text, sessionId } = req.body;
  
  try {
    const response = await ussdService.handleRequest(phoneNumber, text, sessionId);
    res.send(response);
  } catch (error) {
    console.error('USSD error:', error);
    res.send("END Erreur technique. Réessayez.");
  }
});

// AI Orchestration Route
app.post('/api/chat', async (req, res) => {
  const { message, mode } = req.body;
  
  try {
    const result = await orchestrator.handleChat(message, [], mode);
    res.json(result);
  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(500).json({ error: 'LAURA rencontre une difficulté technique.' });
  }
});

// Serve Frontend in Production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 LAURA Server running on port ${PORT}`);
});
