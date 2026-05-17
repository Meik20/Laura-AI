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
    const groqKey = (process.env.GROQ_API_KEY || '').trim();

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
    // 0. Cache Check
    try {
      const cacheKey = `${mode}:${query.toLowerCase()}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    const { model: targetModels, strategy } = this.classifyQuery(query);
    const searchResults = await ragService.search(query);
    const ragContext = searchResults.map(r => `[Source: ${r.source}] ${r.content}`).join('\n---\n');

    const userName = userContext?.prenom || "l'élève";
    const userNiveau = userContext?.niveau && userContext.niveau !== 'Non défini' ? userContext.niveau : "";
    const userExamen = userContext?.examen && userContext.examen !== 'Non défini' ? userContext.examen : "";
    
    // Détermination de l'heure locale (Cameroun)
    const optionsDate = { timeZone: 'Africa/Douala', year: 'numeric', month: 'numeric', day: 'numeric' };
    const dateParts = new Intl.DateTimeFormat('en-US', optionsDate).formatToParts(new Date());
    const localMonth = parseInt(dateParts.find(p => p.type === 'month').value, 10);
    const localDay = parseInt(dateParts.find(p => p.type === 'day').value, 10);
    const localYear = parseInt(dateParts.find(p => p.type === 'year').value, 10);
    
    // JS Date for day of week (months are 0-indexed in Date constructor)
    const localDate = new Date(localYear, localMonth - 1, localDay);
    const dayOfWeek = localDate.getDay(); // 0 = Dimanche, 6 = Samedi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const optionsHour = { timeZone: 'Africa/Douala', hour: '2-digit', hour12: false };
    const currentHour = parseInt(new Intl.DateTimeFormat('fr-FR', optionsHour).format(new Date()), 10);
    
    // Jours fériés fixes au Cameroun
    const holidays = [
      { m: 1, d: 1, name: "le Nouvel An" },
      { m: 2, d: 11, name: "la Fête de la Jeunesse" },
      { m: 5, d: 1, name: "la Fête du Travail" },
      { m: 5, d: 20, name: "la Fête Nationale de l'Unité" },
      { m: 8, d: 15, name: "l'Assomption" },
      { m: 12, d: 25, name: "Noël" }
    ];
    const holiday = holidays.find(h => h.m === localMonth && h.d === localDay);
    
    let timeContext = "";
    if (holiday) {
      timeContext = `Aujourd'hui c'est jour férié au Cameroun (${holiday.name}). L'élève ne va pas à l'école. Utilise ce contexte pour lui demander s'il profite de son jour de repos ou s'il en profite pour rattraper ses révisions.`;
    } else if (isWeekend) {
      timeContext = "Aujourd'hui c'est le week-end ! L'élève se repose de l'école. Souhaite-lui un bon week-end et demande-lui s'il a pu se détendre un peu.";
    } else {
      if (currentHour >= 5 && currentHour < 12) {
        timeContext = "C'est le matin. Tu peux lui souhaiter une bonne journée de cours et beaucoup d'énergie.";
      } else if (currentHour >= 12 && currentHour < 16) {
        timeContext = "C'est l'après-midi. Demande-lui comment se passe sa journée d'école.";
      } else if (currentHour >= 16 && currentHour < 21) {
        timeContext = "C'est la fin de journée/le soir. N'hésite pas à lui demander avec une phrase familière 'Comment a été l'école aujourd'hui ?' ou s'il a beaucoup de devoirs.";
      } else {
        timeContext = "C'est tard le soir. Tu peux lui rappeler doucement de se reposer pour être en forme demain, tout en l'aidant.";
      }
    }
    
    let profileString = `Tu parles à ${userName}`;
    if (userNiveau || userExamen) {
      profileString += `, qui est en ${userNiveau || 'classe'}`;
      if (userExamen) profileString += ` et prépare le ${userExamen}`;
    }
    profileString += `.`;

    let basePrompt = "";
    if (mode === 'devoir') {
      basePrompt = `Tu es LAURA, l'IA tutrice bienveillante et grande sœur académique du programme scolaire camerounais.
TON ÉLÈVE : ${profileString}
TON STYLE : Tu tutoies toujours l'élève ("tu"). Tu es amicale, chaleureuse, très encourageante et accessible.
CONTEXTE TEMPOREL : ${timeContext} Si l'élève te dit bonjour ou lance une nouvelle discussion, utilise ce contexte pour humaniser l'échange.
OBJECTIF COWORK : Ne donne jamais la réponse brute tout de suite. Aide-le à structurer son devoir, donne des indices, et résous l'exercice étape par étape en posant des questions pour le guider.
CONTEXTE DE COURS (RAG) :
${ragContext}
REQUÊTE DE L'ÉLÈVE : ${query}`;
    } else {
      basePrompt = `Tu es LAURA, l'IA tutrice bienveillante et grande sœur académique du programme scolaire camerounais.
TON ÉLÈVE : ${profileString}
TON STYLE : Tu tutoies toujours l'élève ("tu"). Tu es amicale, chaleureuse, très encourageante et accessible. Personnalise tes exemples selon son niveau et la réalité camerounaise.
CONTEXTE TEMPOREL : ${timeContext} Si l'élève te salue, glisse un petit mot familier et affectueux sur l'heure de la journée (ex: l'école s'est bien passée ?).
DIRECTIVE : Réponds de façon claire, pédagogique et engageante en utilisant ce contexte si pertinent :
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
