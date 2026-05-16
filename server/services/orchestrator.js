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
   * Main chat handling logic with Fallback Mechanism
   */
  async handleChat(query, context = []) {
    const { model: primaryModel, strategy } = this.classifyQuery(query);
    
    // 1. RAG Search (Grounding)
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => `[Source: ${r.source}] ${r.content}`).join('\n---\n');

    const prompt = `Tu es LAURA (Learning AI & Unified Resource Assistant), une assistante éducative experte du programme scolaire camerounais (MINESEC/GCE Board).
Tes réponses doivent être pédagogiques, claires et basées EXCLUSIVEMENT sur les documents officiels fournis ci-dessous.

DOCUMENTS OFFICIELS :
${ragContext}

QUESTION DE L'ÉLÈVE :
${query}`;

    // Define the sequence of models to try (Fallback Chain)
    const modelOrder = [primaryModel, 'claude', 'gemini', 'grok'].filter((v, i, a) => a.indexOf(v) === i);
    
    let responseText = "";
    let finalModelUsed = "";
    let errors = [];

    for (const model of modelOrder) {
      try {
        console.log(`[LAURA] Attempting with model: ${model}`);
        
        if (model === 'claude' && this.anthropic) {
          const msg = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          });
          responseText = msg.content[0].text;
          finalModelUsed = 'claude';
          break;
        } 
        else if (model === 'gemini' && this.genAI) {
          // Standard model name for Gemini 1.5 Flash
          const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await geminiModel.generateContent(prompt);
          responseText = result.response.text();
          finalModelUsed = 'gemini';
          break;
        }
        else if (model === 'grok' && this.grok) {
          // Using grok-2 which is the current stable production model
          const completion = await this.grok.chat.completions.create({
            model: "grok-2",
            messages: [{ role: "user", content: prompt }],
          });
          responseText = completion.choices[0].message.content;
          finalModelUsed = 'grok';
          break;
        }
      } catch (err) {
        console.warn(`[LAURA] Model ${model} failed:`, err.message);
        errors.push(`${model}: ${err.message}`);
      }
    }

    if (!responseText) {
      responseText = "Désolée, tous mes cerveaux IA sont indisponibles ou n'ont plus de crédits.\nDétails : " + errors.join(' | ');
    }

    return {
      response: responseText,
      model_used: finalModelUsed || 'none',
      strategy_used: strategy,
      citations: searchResults.map(r => r.source),
      version: "1.0.2",
      is_fallback: finalModelUsed !== primaryModel && finalModelUsed !== ""
    };
  }
}

module.exports = new Orchestrator();
