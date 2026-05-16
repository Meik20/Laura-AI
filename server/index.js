const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const orchestrator = require('./services/orchestrator');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes Placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', project: 'LAURA', version: '1.0.0' });
});

// AI Orchestration Route
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  
  try {
    const result = await orchestrator.handleChat(message, context);
    res.json(result);
  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(500).json({ error: 'LAURA rencontre une difficulté technique.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LAURA Server running on port ${PORT}`);
});
