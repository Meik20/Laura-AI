/**
 * LAURA AI Orchestrator
 * Handles routing between models (Claude, Gemini, Grok, Mistral)
 */

const ragService = require('./rag');
const cacheService = require('./cache');
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

    // Local Model Configuration (Ollama / LocalAI)
    this.localModelURL = process.env.LOCAL_MODEL_URL || 'http://localhost:11434/v1';
    this.localModel = new OpenAI({
      apiKey: 'ollama', // Placeholder for local
      baseURL: this.localModelURL,
    });
  }

  /**
   * Classify the query to determine the best model/strategy based on the matrix
   */
  classifyQuery(query) {
    const q = query.toLowerCase();
    
    // Matrice de routage intelligente
    if (q.includes('image') || q.includes('schéma') || q.includes('diagramme')) {
      return { model: 'gemini', strategy: this.strategies.SIMPLE };
    }
    
    if (q.includes('dissertation') || q.includes('philo') || q.includes('argumentation') || q.includes('math')) {
      return { model: 'claude', strategy: this.strategies.SIMPLE };
    }

    if (q.includes('svt') || q.includes('bio') || q.includes('sciences')) {
      return { model: ['gemini', 'claude'], strategy: this.strategies.CONSENSUS };
    }

    if (q.includes('histoire') || q.includes('géo') || q.includes('emc') || q.includes('langue')) {
      return { model: ['grok', 'claude'], strategy: this.strategies.CONSENSUS };
    }

    if (q.includes('correction') || q.includes('rédige') || q.includes('vérifie')) {
      return { model: 'claude', strategy: this.strategies.CRITIQUE };
    }

    if (q.includes('concours') || q.includes('résultat') || q.includes('exam')) {
      return { model: 'grok', strategy: this.strategies.SIMPLE };
    }

    // Default: High complexity or ambiguous
    if (q.length > 150) {
      return { model: ['claude', 'gemini', 'grok'], strategy: this.strategies.CONSENSUS };
    }

    return { model: 'grok', strategy: this.strategies.SIMPLE };
  }

  /**
   * Execute a single model call with parameters
   */
  async callModel(model, prompt) {
    try {
      if (model === 'claude' && this.anthropic) {
        const msg = await this.anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });
        return { text: msg.content[0].text, model: 'claude' };
      } 
      else if (model === 'gemini' && this.genAI) {
        const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await geminiModel.generateContent(prompt);
        return { text: result.response.text(), model: 'gemini' };
      }
      else if (model === 'grok' && this.grok) {
        const modelName = this.isGroq ? "llama-3.3-70b-versatile" : "grok-2";
        const completion = await this.grok.chat.completions.create({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
        });
        return { text: completion.choices[0].message.content, model: this.isGroq ? 'groq' : 'grok' };
      }
      else if (model === 'local') {
        const completion = await this.localModel.chat.completions.create({
          model: "mistral", // Assuming Mistral is loaded in Ollama
          messages: [{ role: "user", content: prompt }],
        });
        return { text: completion.choices[0].message.content, model: 'Mistral 7B (Local)' };
      }
    } catch (err) {
      throw new Error(`${model} failed: ${err.message}`);
    }
    throw new Error(`${model} not configured`);
  }

  /**
   * Main chat handling logic with Advanced Strategies
   */
  async handleChat(query, context = [], mode = 'revision') {
    // 0. Cache Check
    try {
      const cacheKey = `${mode}:${query.toLowerCase()}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    const { model: targetModels, strategy } = this.classifyQuery(query);
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => `[Source: ${r.source}] ${r.content}`).join('\n---\n');

    let basePrompt = "";
    if (mode === 'devoir') {
      basePrompt = `Tu es LAURA en mode COWORK (Collaboration Devoir).
OBJECTIF : Aide l'élève à structurer son devoir, à résoudre l'exercice étape par étape sans donner la réponse brute immédiatement.
CONSIGNE : Sois très structuré. Utilise des listes, des schémas textuels ou des démonstrations claires.
CONTEXTE OFFICIEL :
${ragContext}
REQUÊTE DE L'ÉLÈVE : ${query}`;
    } else {
      basePrompt = `Tu es LAURA, assistante experte du programme scolaire camerounais.
DIRECTIVE : Réponds de façon pédagogique et concise en te basant sur ce contexte :
${ragContext}
QUESTION : ${query}`;
    }

    let responseText = "";
    let finalModelUsed = "";
    const modelsToTry = Array.isArray(targetModels) ? [...targetModels, 'local'] : [targetModels, 'local'];

    try {
      if (strategy === this.strategies.CONSENSUS) {
        console.log(`[LAURA] Strategy: CONSENSUS with models: ${modelsToTry.join(', ')}`);
        const consensusModels = modelsToTry.filter(m => m !== 'local');
        const results = await Promise.allSettled(consensusModels.map(m => this.callModel(m, basePrompt)));
        const successResults = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        
        if (successResults.length > 0) {
          responseText = successResults[0].text;
          finalModelUsed = `Consensus (${successResults.map(r => r.model).join('+')})`;
        } else {
          const res = await this.callModel('local', basePrompt);
          responseText = res.text;
          finalModelUsed = res.model;
        }
      } 
      else if (strategy === this.strategies.CRITIQUE) {
        try {
          const generator = await this.callModel('claude', basePrompt);
          const criticPrompt = `Vérifie cette réponse par rapport aux sources : ${generator.text}`;
          const verified = await this.callModel('gemini', criticPrompt);
          responseText = verified.text;
          finalModelUsed = "Critique Croisée (Claude/Gemini)";
        } catch (e) {
          const res = await this.callModel('local', basePrompt);
          responseText = res.text;
          finalModelUsed = res.model;
        }
      }
      else {
        for (const m of modelsToTry) {
          try {
            const res = await this.callModel(m, basePrompt);
            responseText = res.text;
            finalModelUsed = res.model;
            break;
          } catch (e) {
            console.warn(`[LAURA] Fallback triggered from ${m}`);
          }
        }
      }
    } catch (err) {
      console.error("[ORCHESTRATOR ERROR]", err);
    }

    if (!responseText) responseText = "Désolée, je rencontre une difficulté technique extrême.";

    const result = {
      response: responseText,
      model_used: finalModelUsed,
      strategy_used: strategy,
      citations: searchResults.map(r => r.source),
      version: "1.3.0"
    };

    // Store in Cache (1 hour)
    try {
      await cacheService.set(query.toLowerCase(), JSON.stringify(result));
    } catch (e) {}

    return result;
  }
}

module.exports = new Orchestrator();
