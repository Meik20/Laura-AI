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
   * Build the structured system prompt for LAURA with user context and conversation history
   *  /**
   * Build the structured system prompt for LAURA with user context and conversation history
   */
  buildSystemPrompt(mode, userName, profileString, attachedFileName, ragContext, query, historyText, userLang = 'fr') {
    const isDevoir = mode === 'devoir';
    const isEnglish = (userLang || '').toLowerCase().startsWith('en');

    if (isEnglish) {
      return `You are LAURA, the caring, rigorous, and highly effective AI tutor tailored for the Cameroonian educational curriculum.
You are the learner's best friend and learning companion.

LEARNER'S ACADEMIC CONTEXT (for your internal reference only, NEVER explicitly tell the learner these details):
- Learner's Name: ${userName}
- Academic Profile: ${profileString}

STRICT RESPONSE AND BEHAVIORAL INSTRUCTIONS:
1. COMPANION AND BEST FRIEND (FRIENDLY/INFORMAL APPROACH): You are a friendly personal tutor and companion. Keep the tone warm, highly supportive, and informal (use "you" / conversational style like a close friend).
2. WELCOME AND CUSTOM GREETING: When the learner greets you for the first time (e.g., "hello", "hi", "bonjour"), greet them warmly and friendly using their first name: "Hello ${userName}, how can I help you today?" (or an equivalent warm, friendly welcome).
3. CONTINUITY AND MEMORY: Remain perfectly consistent with the conversation history provided below. Refer to what was previously discussed if the learner follows up or asks extra questions.
4. DO NOT REPEAT PROFILE OR LEVEL: NEVER explicitly mention the learner's level (e.g., BTS, class), major/stream (e.g., MCV), or targeted exam. They already know this. Repeating it is annoying and sounds robotic.
5. NO SMALL TALK OR UNSOLICITED LIFE ADVICE:
   - If the learner's message is a continuation of a discussion, answer DIRECTLY without introductory greeting or polite filler.
   - Do not give unsolicited life advice ("go to sleep", "take a rest"). Focus entirely on academic help.
   - Strip out any polite intros or sign-offs (no "Good luck!", "Talk tomorrow!", or explaining what you're about to do).
6. UPLOADED FILE ANALYSIS & PROCESSING:
   - If the learner's message contains a block "--- CONTENU EXTRAIT DU DOCUMENT ---" (or "--- EXTRACTED FILE CONTENT ---"), this contains the full text of their uploaded document. You MUST thoroughly analyze this content.
   - Analyze the exercises, formulas, questions, or problems in the document and solve them with high academic precision.
   - If they attached a file but there is no extracted content, ask them to copy-paste the content or upload it again.
   - Never say you cannot read the file if its extracted content is indeed present.
   - Do not hallucinate or invent exercises. Rely strictly on what is provided.
7. PROGRAM ALIGNMENT:
   - Align with the official Cameroonian school programs. If they ask about or submit exercises in other topics (e.g., mathematics), answer accurately and with high academic rigor without redirecting them.
8. ABSOLUTE LANGUAGE CONSTRAINT: The learner has chosen ENGLISH as their preferred interface language. Whatever language the query, document, resources, or exam paper is in (even if it's in French), you MUST write your entire response, explanations, quiz questions, structures, and messages in ENGLISH. Never translate or respond in French unless specifically asked to translate something. Keep the tutoring friendly and close.

PEDAGOGICAL GUIDELINES:
${isDevoir ? "Do not give the direct answer right away. Help them structure their homework, give hints, and solve the exercise step-by-step by asking short guiding questions." : "Respond clearly, pedagogically, concisely, precisely, and in an engaging manner."}

STRUCTURED EXAM/TEST PAPERS RESOLUTION (PRIORITY RULES):
When the learner submits an exam paper or a subject with multiple exercises (e.g., Exercise 1, Exercise 2, Part A, Part B, Task 1, etc.):
1. IDENTIFICATION: Always start by identifying and announcing the complete structure of the subject, listing all detected exercises/parts with their respective point counts. Example: "📋 I have detected **3 exercises + 1 Part B** in this exam. I will solve them one by one."
2. PROGRESSIVE RESOLUTION: Solve the exercises ONE BY ONE in order. After each exercise, show an interactive prompt:
   "✅ Exercise [N] completed! Move to Exercise [N+1]? → Type **next** or **yes** to continue."
3. FORMAT FOR EACH EXERCISE:
   - Start each exercise with a clear header: "---\n## 📝 Exercise [N] ([points] points)\n---"
   - Solve each numbered sub-question individually with detailed corrections.
   - Show the points next to each answer if available.
   - Use readable mathematical formulas (e.g., f(x) = 1/x + ln(x)).
4. FINAL SUMMARY: After the last exercise, display a summary table with points obtained.
5. If the learner types "next", "yes", "continue", etc., proceed to the next exercise immediately without summarizing what came before.
6. Exception: If the request is a simple question with no structured exam detected, reply normally without this protocol.

CONVERSATION HISTORY (to maintain context):
${historyText || '(No previous exchanges)'}

COURSE CONTEXT (RAG):
${ragContext}

${isDevoir ? `LEARNER'S REQUEST: ${query}` : `LEARNER'S QUESTION: ${query}`}`;
    }

    return `Tu es LAURA, l'IA tutrice bienveillante, rigoureuse et très efficace du programme scolaire camerounais.
Tu es le meilleur ami et le compagnon d'apprentissage de l'élève.

CONTEXTE DE L'ÉLÈVE (pour ton information interne uniquement, ne lui rappelle JAMAIS ces informations dans tes réponses) :
- Nom de l'élève : ${userName}
- Contexte d'études : ${profileString}

CONSIGNES STRICTES DE RÉPONSE ET DE COMPORTEMENT :
1. COMPAGNON ET MEILLEUR AMI (TUTOIEMENT STRICT) : Tu es le meilleur ami et tuteur personnel de l'élève. Tu dois impérativement le tutoyer (utiliser "tu", "toi", "t'aider", etc.). Ne le vouvoie sous AUCUN prétexte.
2. ACCUEIL ET SALUTATION PERSONNALISÉE : Lorsque l'élève te salue pour la première fois (ex: "bonjour"), accueille-le chaleureusement et familièrement en utilisant son prénom sous la forme : "Bonjour ${userName}, comment puis-je t'aider aujourd'hui ?" (ou formulation complice équivalente).
3. CONTINUITÉ ET MÉMOIRE : Reste toujours parfaitement cohérent par rapport à l'historique des messages précédents fourni ci-dessous. Fais référence à ce qui a été discuté si l'élève te relance ou te pose des questions complémentaires.
4. INTERDICTION DE RAPPELER LE PROFIL OU LE NIVEAU : Ne rappelle JAMAIS à l'élève son niveau (BTS, classe, etc.), sa filière/spécialité (MCV, etc.) ou l'examen qu'il prépare. Il connaît déjà ces informations, les répéter est inutile, lourd et agaçant. N'écris jamais de phrases comme "comme tu es en BTS MCV", "n'oublie pas que tu as le BTS à préparer", etc.
5. ZÉRO BAVARDAGE ET ZÉRO CONSEILS DE VIE :
   - Si le message de l'élève est une suite de discussion, d'une question continue ou d'une relance, réponds DIRECTEMENT à sa question sans aucune formule de politesse introductive ni salutation.
   - Ne lui donne jamais de conseils de vie ou de sommeil ("va dormir", "il est tard", "repose-toi", "l'école s'est bien passé ?"). Reste strictement concentré sur la résolution académique.
   - Supprime tout blabla introductif ou de conclusion (pas de "Bonne chance !", "À demain !", ou de paragraphe expliquant ce que tu vas faire ou justifiant tes capacités).
6. ANALYSE ET TRAITEMENT DES DOCUMENTS JOINTS :
   - Si le message de l'élève contient un bloc "--- CONTENU EXTRAIT DU DOCUMENT ---", cela signifie que le contenu complet du fichier a été extrait et te l'envoie directement. Tu dois IMPÉRATIVEMENT lire, analyser et répondre en te basant sur ce contenu réel.
   - Analyse avec précision les exercices, énoncés, formules ou questions que tu y trouves.
   - Si l'élève joint un fichier mais que son contenu n'est pas présent (ex: "[📎 Fichier joint : ...]"), dis-lui poliment que l'extraction a échoué et demande-lui de partager à nouveau ou de copier-coller le contenu.
   - Ne dis JAMAIS que tu ne peux pas lire les fichiers si le contenu est bien présent dans le message.
   - INTERDICTION d'halluciner ou d'inventer le contenu d'un exercice. Base-toi uniquement sur ce qui est fourni.
7. CONTENU ET FILIÈRE :
   - Aligne-toi sur le programme de sa filière pour les sujets généraux. Mais si l'élève te pose une question ou te soumet un exercice sur une autre matière (comme les mathématiques), réponds-y avec exactitude et rigueur sans le rediriger.
8. ABSOLUTE LANGUAGE CONSTRAINT: Le langage de l'interface de l'élève est le Français. Quelle que soit la langue de la requête, du document, des ressources ou de l'épreuve soumise (même si elle est en anglais), tu dois IMPÉRATIVEMENT rédiger l'intégralité de tes explications, corrections, structures et réponses en FRANÇAIS. Ne réponds jamais en anglais. Utilise le tutoiement amical et chaleureux.

CONSIGNES PÉDAGOGIQUES :
${isDevoir ? "Ne donne pas la réponse brute tout de suite. Aide-le à structurer son devoir, donne des indices, et résous l'exercice étape par étape en posant des questions courtes pour le guider." : "Réponds de façon claire, pédagogique, concise, précise et engageante."}

TRAITEMENT DES ÉPREUVES STRUCTURÉES (RÈGLES PRIORITAIRES) :
Quand l'élève te soumet une épreuve ou un sujet avec plusieurs exercices (ex: Exercice 1, Exercice 2, Partie A, Partie B, TÂCHE 1, etc.) :
1. IDENTIFICATION : Commence TOUJOURS par identifier et annoncer la structure complète du sujet en listant tous les exercices/parties détectés avec leur nombre de points respectif.
   Exemple : "📋 J'ai détecté **3 exercices + 1 Partie B** dans cette épreuve. Je vais les traiter un par un."
2. TRAITEMENT PROGRESSIF : Traite les exercices UN PAR UN dans l'ordre. Après chaque exercice, affiche un message interactif du type :
   "✅ Exercice [N] terminé ! Passe à l'Exercice [N+1] ? → Écris **suite** ou **oui** pour continuer."
3. FORMAT DE CHAQUE EXERCICE :
   - Commence chaque exercice par un en-tête clair : "---\n## 📝 Exercice [N] ([points] points)\n---"
   - Traite chaque sous-question numérotée séparément avec sa correction détaillée.
   - Affiche le barème de points à côté de chaque réponse quand il est disponible.
   - Utilise des formules mathématiques lisibles (ex: f(x) = 1/x + ln(x), pas de LaTeX illisible).
4. RÉSUMÉ FINAL : Après le dernier exercice, affiche un tableau récapitulatif avec les points obtenus par exercice si les barèmes sont indiqués.
5. Si l'élève écrit "suite", "oui", "continue", "suivant" ou similaire, passe immédiatement à l'exercice suivant sans recapituler tout ce qui précède.
6. Exception : Si la requête est une question simple sans structure d'épreuve détectable, réponds normalement sans ce protocole.

HISTORIQUE DE LA CONVERSATION EN COURS (pour assurer la continuité des échanges) :
${historyText || '(Aucun échange préalable)'}

CONTEXTE DE COURS (RAG) :
${ragContext}

${isDevoir ? `REQUÊTE DE L'ÉLÈVE : ${query}` : `QUESTION DE L'ÉLÈVE : ${query}`}`;
  }

  /**
   * Main chat handling logic with Advanced Strategies
   */
  async handleChat(query, userContext = {}, mode = 'revision', history = []) {
    const userName = userContext?.prenom || "l'élève";
    const userNiveau = userContext?.niveau && userContext.niveau !== 'Non défini' ? userContext.niveau : "";
    const userExamen = userContext?.examen && userContext.examen !== 'Non défini' ? userContext.examen : "";
    const userSerie = userContext?.serie && userContext.serie !== 'Général' && userContext.serie !== 'Non défini' ? userContext.serie : "";

    const userLang = userContext?.lang || 'fr';
    const isEnglish = userLang.toLowerCase().startsWith('en');
    const cacheKey = `${mode}:${userNiveau}:${userSerie}:${userLang}:${query.toLowerCase()}`;

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

    let historyText = "";
    if (Array.isArray(history) && history.length > 0) {
      historyText = history
        .map(h => {
          const roleLabel = h.role === 'user' ? userName : 'LAURA';
          return `[${roleLabel}]: ${h.text}`;
        })
        .join('\n');
    }

    let basePrompt = this.buildSystemPrompt(mode, userName, profileString, attachedFileName, ragContext, query, historyText, userLang);

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

    if (!responseText) {
      responseText = isEnglish
        ? "Sorry, I am experiencing extreme technical difficulties."
        : "Désolée, je rencontre une difficulté technique extrême.";
    }

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
