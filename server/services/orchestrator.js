/**
 * LAURA Orchestrator
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
    const groqKey = (process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '').trim();

    console.log(`[LAURA Service] Initializing with keys: Anthropic=${!!anthropicKey}, Gemini=${!!googleKey}, Groq=${!!groqKey}`);

    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.genAI = googleKey ? new GoogleGenerativeAI(googleKey) : null;
    
    // Groq (LPU) Configuration
    this.groq = groqKey ? new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    }) : null;

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
    // Pour l'instant, le modèle doit utiliser GROQ en priorité
    return { model: 'groq', strategy: this.strategies.SIMPLE };
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
      else if (model === 'groq' && this.groq) {
        const completion = await this.groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
        });
        return { text: completion.choices[0].message.content, model: 'groq' };
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
  async handleChat(query, userContext = {}, mode = 'revision') {
    const userName = userContext?.prenom || "l'élève";
    const userNiveau = userContext?.niveau && userContext.niveau !== 'Non défini' ? userContext.niveau : "";
    const userExamen = userContext?.examen && userContext.examen !== 'Non défini' ? userContext.examen : "";
    const userSerie = userContext?.serie && userContext.serie !== 'Général' && userContext.serie !== 'Non défini' ? userContext.serie : "";

    const cacheKey = `${mode}:${userNiveau}:${userSerie}:${query.toLowerCase()}`;

    // 0. Cache Check
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    const { model: targetModels, strategy } = this.classifyQuery(query);
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => `[Source: ${r.source}] ${r.content}`).join('\n---\n');

    // Extraction automatique du nom de la pièce jointe si présente dans le message
    const attachmentMatch = query.match(/\[📎 Fichier joint : ([^\]]+)\]/);
    const attachedFileName = attachmentMatch ? attachmentMatch[1] : null;

    let profileString = `Tu parles à ${userName}`;
    if (userNiveau || userExamen) {
      profileString += `, qui étudie au niveau ${userNiveau || 'classe'}`;
      if (userSerie) profileString += ` (spécialité/série/filière ${userSerie})`;
      if (userExamen) profileString += ` et prépare l'examen officiel du ${userExamen}`;
    } else if (userSerie) {
      profileString += `, dont la spécialité/série/filière d'études est ${userSerie}`;
    }
    profileString += `.`;

    let basePrompt = "";
    if (mode === 'devoir') {
      basePrompt = `Tu es LAURA, l'IA tutrice bienveillante, rigoureuse et très efficace du programme scolaire camerounais.

CONTEXTE DE L'ÉLÈVE (pour ton information interne uniquement, ne lui rappelle JAMAIS ces informations dans tes réponses) :
- Nom de l'élève : ${userName}
- Contexte d'études : ${profileString}

CONSIGNES STRICTES DE RÉPONSE ET DE COMPORTEMENT :
1. INTERDICTION DE RAPPELER LE PROFIL OU LE NIVEAU : Ne rappelle JAMAIS à l'élève son niveau (BTS, classe, etc.), sa filière/spécialité (MCV, etc.) ou l'examen qu'il prépare. Il connaît déjà ces informations, les répéter est inutile, lourd et agaçant. N'écris jamais de phrases comme "comme tu es en BTS MCV", "n'oublie pas que tu as le BTS à préparer", etc.
2. ZÉRO BAVARDAGE, ZÉRO CONSEILS DE VIE ET ZÉRO SALUTATIONS D'OFFICE :
   - Ne salue l'élève (bonjour, salut, etc.) que si et seulement si son message contient explicitement une salutation directe d'ouverture (ex: "bonjour", "salut"). S'il s'agit d'une suite de discussion, d'une question continue ou d'une relance, réponds DIRECTEMENT à sa question sans aucune formule de politesse introductive.
   - Ne lui donne jamais de conseils de vie ou de sommeil ("va dormir", "il est tard", "repose-toi", "l'école s'est bien passée ?"). Reste strictement concentrée sur la résolution académique.
   - Supprime tout blabla introductif ou de conclusion (pas de "Bonne chance !", "À demain !", ou de paragraphe expliquant ce que tu vas faire ou justifiant tes capacités).
3. ANALYSE ET PRÉVENTION DE L'HALLUCINATION SUR PIÈCE JOINTE :
   - Si le message de l'élève indique qu'il a partagé un fichier (ex: le message contient "[📎 Fichier joint : ${attachedFileName || '...'}]") ou s'il te soumet un exercice (par exemple de mathématiques ou de gestion), tu devez STRICTEMENT analyser et répondre à son sujet ou matière précis sans halluciner et sans forcer le sujet à rentrer dans le cadre de sa filière commerciale (MCV/RCNV).
   - Ne dis JAMAIS de bêtises du style "Je vais corriger ton exercice de Relation Client" s'il s'agit de mathématiques, de physique ou de géographie !
   - ${attachedFileName ? `Puisque l'élève a joint le fichier "${attachedFileName}", commence immédiatement par lui dire poliment et brièvement que tu as bien noté qu'il a partagé le document "${attachedFileName}", mais que l'interface actuelle ne transmettant que le nom du fichier sans en extraire automatiquement le texte ou les images, il doit lui-même copier-coller l'énoncé textuel ou détailler les questions de son exercice dans le chat pour que tu puisses le corriger avec exactitude.` : ''}
4. CONTENU ET FILIÈRE :
   - Aligne-toi sur le programme de sa filière pour les sujets généraux. Mais si l'élève te pose une question ou te soumet un exercice sur une autre matière (comme les mathématiques), réponds-y avec exactitude et rigueur sans le rediriger.

CONSIGNES PÉDAGOGIQUES :
Ne donne pas la réponse brute tout de suite. Aide-le à structurer son devoir, donne des indices, et résous l'exercice étape par étape en posant des questions courtes pour le guider.

CONTEXTE DE COURS (RAG) :
${ragContext}

REQUÊTE DE L'ÉLÈVE : ${query}`;
    } else {
      basePrompt = `Tu es LAURA, l'IA tutrice bienveillante, rigoureuse et très efficace du programme scolaire camerounais.

CONTEXTE DE L'ÉLÈVE (pour ton information interne uniquement, ne lui rappelle JAMAIS ces informations dans tes réponses) :
- Nom de l'élève : ${userName}
- Contexte d'études : ${profileString}

CONSIGNES STRICTES DE RÉPONSE ET DE COMPORTEMENT :
1. INTERDICTION DE RAPPELER LE PROFIL OU LE NIVEAU : Ne rappelle JAMAIS à l'élève son niveau (BTS, classe, etc.), sa filière/spécialité (MCV, etc.) ou l'examen qu'il prépare. Il connaît déjà ces informations, les répéter est inutile, lourd et agaçant. N'écris jamais de phrases comme "comme tu es en BTS MCV", "n'oublie pas que tu as le BTS à préparer", etc.
2. ZÉRO BAVARDAGE, ZÉRO CONSEILS DE VIE ET ZÉRO SALUTATIONS D'OFFICE :
   - Ne salue l'élève (bonjour, salut, etc.) que si et seulement si son message contient explicitement une salutation directe d'ouverture (ex: "bonjour", "salut"). S'il s'agit d'une suite de discussion, d'une question continue ou d'une relance, réponds DIRECTEMENT à sa question sans aucune formule de politesse introductive.
   - Ne lui donne jamais de conseils de vie ou de sommeil ("va dormir", "il est tard", "repose-toi", "l'école s'est bien passée ?"). Reste strictement concentrée sur la résolution académique.
   - Supprime tout blabla introductif ou de conclusion (pas de "Bonne chance !", "À demain !", ou de paragraphe expliquant ce que tu vas faire ou justifiant tes capacités).
3. ANALYSE ET PRÉVENTION DE L'HALLUCINATION SUR PIÈCE JOINTE :
   - Si le message de l'élève indique qu'il a partagé un fichier (ex: le message contient "[📎 Fichier joint : ${attachedFileName || '...'}]") ou s'il te soumet un exercice (par exemple de mathématiques ou de gestion), tu devez STRICTEMENT analyser et répondre à son sujet ou matière précis sans halluciner et sans forcer le sujet à rentrer dans le cadre de sa filière commerciale (MCV/RCNV).
   - Ne dis JAMAIS de bêtises du style "Je vais corriger ton exercice de Relation Client" s'il s'agit de mathématiques, de physique ou de géographie !
   - ${attachedFileName ? `Puisque l'élève a joint le fichier "${attachedFileName}", commence immédiatement par lui dire poliment et brièvement que tu as bien noté qu'il a partagé le document "${attachedFileName}", mais que l'interface actuelle ne transmettant que le nom du fichier sans en extraire automatiquement le texte ou les images, il doit lui-même copier-coller l'énoncé textuel ou détailler les questions de son exercice dans le chat pour que tu puisses le corriger avec exactitude.` : ''}
4. CONTENU ET FILIÈRE :
   - Aligne-toi sur le programme de sa filière pour les sujets généraux. Mais si l'élève te pose une question ou te soumet un exercice sur une autre matière (comme les mathématiques), réponds-y avec exactitude et rigueur sans le rediriger.

CONSIGNES PÉDAGOGIQUES :
Réponds de façon claire, pédagogique, concise, précise et engageante.

CONTEXTE DE COURS (RAG) :
${ragContext}

QUESTION DE L'ÉLÈVE : ${query}`;
    }

    let responseText = "";
    let finalModelUsed = "";
    const allAvailableModels = ['groq', 'gemini', 'claude', 'local'];
    const modelsToTry = Array.isArray(targetModels) ? [...targetModels, ...allAvailableModels.filter(m => !targetModels.includes(m))] : [targetModels, ...allAvailableModels.filter(m => m !== targetModels)];

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
            console.warn(`[LAURA] Fallback triggered from ${m}:`, e.message);
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
      await cacheService.set(cacheKey, JSON.stringify(result));
    } catch (e) {}

    return result;
  }
}

module.exports = new Orchestrator();
