/**
 * LAURA AI Orchestrator
 * Handles routing between models (Claude, Gemini, Grok, Mistral)
 */

const ragService = require('./rag');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

class Orchestrator {
  constructor() {
    this.strategies = {
      SIMPLE: 'simple',
      CONSENSUS: 'consensus',
      VISION: 'vision'
    };

    // Initialize SDKs
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    const googleKey = (process.env.GOOGLE_AI_API_KEY || '').trim();
    const grokKey = (process.env.GROK_API_KEY || '').trim();

    console.log(`[LAURA Service] Initializing with keys: Anthropic=${!!anthropicKey}, Gemini=${!!googleKey}, Grok=${!!grokKey}`);

    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.genAI = googleKey ? new GoogleGenerativeAI(googleKey) : null;
    this.grok = grokKey ? new OpenAI({
      apiKey: grokKey,
      baseURL: "https://api.x.ai/v1",
    }) : null;
  }

  /**
   * Classify the query to determine the best model/strategy
   */
  classifyQuery(query) {
    const q = query.toLowerCase();
    
    if (q.includes('image') || q.includes('schéma') || q.includes('dessin') || q.includes('pdf')) {
      return { model: 'gemini', strategy: this.strategies.VISION };
    }
    
    if (q.includes('dissertation') || q.includes('philo') || q.includes('raisonnement')) {
      return { model: 'claude', strategy: this.strategies.SIMPLE };
    }

    if (q.includes('concours') || q.includes('actu') || q.includes('minesec')) {
      return { model: 'grok', strategy: this.strategies.SIMPLE };
    }

    return { model: 'claude', strategy: this.strategies.SIMPLE };
  }

  /**
   * Main chat handling logic
   */
  async handleChat(query, context = []) {
    const { model, strategy } = this.classifyQuery(query);
    
    // 1. RAG Search (Grounding)
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => `[Source: ${r.source}] ${r.content}`).join('\n---\n');

    const prompt = `Tu es LAURA (Learning AI & Unified Resource Assistant), une assistante éducative experte du programme scolaire camerounais (MINESEC/GCE Board).
Tes réponses doivent être pédagogiques, claires et basées EXCLUSIVEMENT sur les documents officiels fournis ci-dessous.
Si la réponse n'est pas dans le contexte, dis-le poliment et propose d'aider sur un autre sujet.

DOCUMENTS OFFICIELS :
${ragContext}

QUESTION DE L'ÉLÈVE :
${query}`;

    let responseText = "";

    try {
      if (model === 'claude' && this.anthropic) {
        const msg = await this.anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });
        responseText = msg.content[0].text;
      } 
      else if (model === 'gemini' && this.genAI) {
        const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await geminiModel.generateContent(prompt);
        responseText = result.response.text();
      }
      else if (model === 'grok' && this.grok) {
        const completion = await this.grok.chat.completions.create({
          model: "grok-beta", // or the specific xAI model
          messages: [{ role: "user", content: prompt }],
        });
        responseText = completion.choices[0].message.content;
      }
      else {
        responseText = "[Mode Simulation] Désolé, le modèle " + model + " n'est pas encore configuré avec une clé API valide.";
      }
    } catch (err) {
      console.error(`Error with ${model}:`, err);
      responseText = "Désolée, j'ai eu une erreur en contactant mon cerveau IA (" + model + ").";
    }

    return {
      response: responseText,
      model_used: model,
      strategy_used: strategy,
      citations: searchResults.map(r => r.source)
    };
  }
}

module.exports = new Orchestrator();
