/**
 * LAURA AI Orchestrator
 * Handles routing between models (Claude, Gemini, Grok, Mistral)
 */

const ragService = require('./rag');

class Orchestrator {
  constructor() {
    this.strategies = {
      SIMPLE: 'simple',
      CONSENSUS: 'consensus',
      VISION: 'vision'
    };
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
    
    // 1. RAG Search
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => r.content).join('\n---\n');

    console.log(`[LAURA] Routing to ${model} with strategy ${strategy}`);

    // 2. Mock response with RAG Grounding
    return {
      response: `[Simulation ${model}] En me basant sur les documents officiels : "${ragContext.substring(0, 50)}...", voici ma réponse.`,
      model_used: model,
      strategy_used: strategy,
      citations: searchResults.map(r => r.source)
    };
  }
}

module.exports = new Orchestrator();
