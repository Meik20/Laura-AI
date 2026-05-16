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

    console.log(`[LAURA Service] Initializing with keys: Anthropic=${!!anthropicKey}, Gemini=${!!googleKey}, Grok/Groq=${!!grokKey}`);

    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.genAI = googleKey ? new GoogleGenerativeAI(googleKey) : null;
    
    // Auto-detect if it's xAI (Grok) or Groq (LPU)
    const isGroq = grokKey.startsWith('gsk_');
    this.grok = grokKey ? new OpenAI({
      apiKey: grokKey,
      baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://api.x.ai/v1",
    }) : null;
    this.isGroq = isGroq;
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

    return { model: 'grok', strategy: this.strategies.SIMPLE };
  }

  /**
   * Main chat handling logic with Fallback Mechanism
   */
  async handleChat(query, context = []) {
    const { model: primaryModel, strategy } = this.classifyQuery(query);
    
    // 1. RAG Search (Grounding)
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => `[Source: ${r.source}] ${r.content}`).join('\n---\n');

    const prompt = `Tu es LAURA (Learning AI & Unified Resource Assistant), une assistante éducative experte du programme scolaire camerounais.
Tes réponses doivent être pédagogiques et basées sur ce contexte :
${ragContext}

QUESTION : ${query}`;

    // Fallback Chain
    const modelOrder = [primaryModel, 'gemini', 'grok', 'claude'].filter((v, i, a) => a.indexOf(v) === i);
    
    let responseText = "";
    let finalModelUsed = "";
    let errors = [];

    for (const model of modelOrder) {
      try {
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
          const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await geminiModel.generateContent(prompt);
          responseText = result.response.text();
          finalModelUsed = 'gemini';
          break;
        }
        else if (model === 'grok' && this.grok) {
          const modelName = this.isGroq ? "llama-3.1-70b-versatile" : "grok-2";
          const completion = await this.grok.chat.completions.create({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
          });
          responseText = completion.choices[0].message.content;
          finalModelUsed = this.isGroq ? 'groq (llama 3.1)' : 'grok-2';
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
