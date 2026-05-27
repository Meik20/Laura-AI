/**
 * LAURA Orchestrator
 * Handles routing between models (Claude, Gemini, Grok, Mistral)
 */

const ragService = require('./rag');
const cacheService = require('./cache');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// ── Programme Officiel Camerounais (MINESEC / MINEFOP) ──────────────────────
const CAMEROON_CURRICULUM = {
  // ── Séries Lycée Général ────────────────────────────────────────────────
  'A': {
    label: 'Bac Série A — Lettres & Sciences Humaines',
    subjects: ['Philosophie', 'Français', 'Littérature', 'Anglais', 'Histoire-Géographie', 'Latin/Grec (option)', 'Mathématiques (option)'],
    exams: ['Probatoire A', 'Baccalauréat A']
  },
  'B': {
    label: 'Bac Série B — Sciences Économiques & Sociales',
    subjects: ['Économie Générale', 'Comptabilité & Gestion', 'Mathématiques', 'Histoire-Géographie', 'Français', 'Anglais', 'Droit'],
    exams: ['Probatoire B', 'Baccalauréat B']
  },
  'C': {
    label: 'Bac Série C — Mathématiques & Sciences Physiques',
    subjects: ['Mathématiques', 'Sciences Physiques (Physique-Chimie)', 'SVT (option)', 'Français', 'Anglais', 'Philosophie'],
    exams: ['Probatoire C', 'Baccalauréat C']
  },
  'D': {
    label: 'Bac Série D — Sciences de la Vie et de la Terre',
    subjects: ['SVT (Biologie & Géologie)', 'Mathématiques', 'Sciences Physiques', 'Français', 'Anglais', 'Philosophie'],
    exams: ['Probatoire D', 'Baccalauréat D']
  },
  'E': {
    label: 'Bac Série E — Sciences & Technologies Industrielles',
    subjects: ['Mathématiques', 'Sciences Physiques', 'Technologie Industrielle', 'Dessin Technique', 'Français', 'Anglais'],
    exams: ['Probatoire E', 'Baccalauréat E']
  },
  'TI': {
    label: 'Bac Série TI — Technologies de l\'Information',
    subjects: ['Algorithmie & Programmation', 'Systèmes & Réseaux', 'Mathématiques', 'Sciences Physiques', 'Français', 'Anglais'],
    exams: ['Probatoire TI', 'Baccalauréat TI']
  },
  'G': {
    label: 'Bac Série G — Sciences & Techniques de Gestion',
    subjects: ['Comptabilité', 'Économie-Gestion', 'Droit Commercial', 'Mathématiques', 'Français', 'Anglais'],
    exams: ['Probatoire G', 'Baccalauréat G']
  },
  'F': {
    label: 'Bac Série F — Techniques Industrielles',
    subjects: ['Mathématiques', 'Sciences Physiques', 'Technologie', 'Dessin Industriel', 'Français', 'Anglais'],
    exams: ['Probatoire F', 'Baccalauréat F']
  },
  // ── BEPC / Collège ───────────────────────────────────────────────────────
  'BEPC': {
    label: 'BEPC — Fin du Collège (Classe de 3ème)',
    subjects: ['Mathématiques', 'Sciences Physiques', 'SVT', 'Français', 'Anglais', 'Histoire-Géographie', 'Éducation Civique & Morale', 'EPS'],
    exams: ['BEPC']
  },
  // ── BTS ──────────────────────────────────────────────────────────────────
  'MCV': {
    label: 'BTS Marketing, Commerce & Vente (MCV)',
    subjects: ['Marketing', 'Techniques de Vente', 'Commerce International', 'Comptabilité Générale', 'Gestion de la Clientèle', 'Économie d\'Entreprise', 'Droit Commercial', 'Communication d\'Entreprise'],
    exams: ['BTS MCV']
  },
  'SEA': {
    label: 'BTS Secrétariat de Direction (SEA)',
    subjects: ['Secrétariat & Bureautique', 'Sténographie', 'Gestion Administrative', 'Comptabilité', 'Communication', 'Anglais professionnel'],
    exams: ['BTS SEA']
  },
  'COMPTA': {
    label: 'BTS Comptabilité & Gestion d\'Entreprise',
    subjects: ['Comptabilité Générale', 'Comptabilité des Sociétés', 'Fiscalité', 'Analyse Financière', 'Gestion Financière', 'Droit des Affaires', 'Mathématiques Financières'],
    exams: ['BTS Comptabilité']
  },
  'INFO': {
    label: 'BTS Informatique',
    subjects: ['Algorithmie', 'Programmation (C, Python, Java)', 'Bases de données', 'Réseaux & Télécommunications', 'Systèmes d\'exploitation', 'Mathématiques'],
    exams: ['BTS Informatique']
  },
  'FINANCE': {
    label: 'BTS Banque, Finance & Assurance',
    subjects: ['Comptabilité Bancaire', 'Mathématiques Financières', 'Droit Bancaire', 'Assurance', 'Gestion de Portefeuille', 'Économie Monétaire'],
    exams: ['BTS Finance']
  }
};

// ── Helper : trouver le cursus à partir de la série / filière / examen ──────
function getCurriculumContext(userNiveau, userSerie, userExamen) {
  if (!userSerie && !userNiveau && !userExamen) return null;
  const key = Object.keys(CAMEROON_CURRICULUM).find(k => {
    const kLower = k.toLowerCase();
    const sLower = (userSerie || '').toLowerCase();
    const nLower = (userNiveau || '').toLowerCase();
    const eLower = (userExamen || '').toLowerCase();
    return sLower.includes(kLower) || eLower.includes(kLower) || nLower.includes(kLower);
  });
  return key ? CAMEROON_CURRICULUM[key] : null;
}


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
        const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
   */
  buildSystemPrompt(mode, userName, profileString, attachedFileName, ragContext, query, historyText, userLang = 'fr', userNiveau = '', userSerie = '', userExamen = '', documentContext = null, userRole = 'student') {
    const isDevoir = mode === 'devoir';
    const isEnglish = (userLang || '').toLowerCase().startsWith('en');

    // ── Retrieve Cameroonian curriculum for this learner/tutor ───────────────────
    const curriculum = getCurriculumContext(userNiveau, userSerie, userExamen);
    const curriculumBlock = curriculum
      ? `\nPROGRAMME OFFICIEL CAMEROUNAIS (${curriculum.label}) :\nMatières fondamentales de cette filière/série : ${curriculum.subjects.join(', ')}.\nExamen(s) officiel(s) ciblé(s) : ${curriculum.exams.join(', ')}.\nBase EXCLUSIVEMENT tout contenu généré sur ce programme officiel du MINESEC/MINEFOP.\n`
      : `\nPROGRAMME : Profil académique non identifié avec précision. Utilise les informations disponibles (niveau: ${userNiveau || 'non précisé'}, série/filière: ${userSerie || 'non précisée'}, examen: ${userExamen || 'non précisé'}) pour orienter tes réponses.\n`;

    // ── Build document context block (injected just before the query) ──────
    let docBlock = '';
    if (documentContext) {
      const docTitle   = documentContext.titre   || 'Document';
      const docType    = documentContext.type    || (isEnglish ? 'Course/Exam' : 'Cours / Épreuve');
      const docMatiere = documentContext.matiere || (isEnglish ? 'General' : 'Générale');
      const docText    = documentContext.extractedText
        ? documentContext.extractedText.slice(0, 8000)
        : null;

      if (isEnglish) {
        docBlock = `\nDOCUMENT-BASED SESSION (MANDATORY RULES):\nThis revision session is STRICTLY based on the following real document. ALL your responses, explanations, quizzes, exercises and summaries MUST be drawn EXCLUSIVELY from this document. Do NOT invent content not found in this document.\n- Document Title: ${docTitle}\n- Type: ${docType}\n- Subject: ${docMatiere}\n${docText ? `\n--- FULL DOCUMENT CONTENT (use this as your PRIMARY knowledge source) ---\n${docText}\n--- END OF DOCUMENT CONTENT ---` : '- (Full text not available — rely on the document title and subject to contextualize all responses.)'}\n`;
      } else {
        docBlock = `\nCONTEXTE DOCUMENTAIRE DE LA SESSION (RÈGLES ABSOLUES) :\nCette session de révision est STRICTEMENT basée sur le document réel suivant. TOUTES tes réponses, explications, quiz, exercices et résumés DOIVENT être tirés EXCLUSIVEMENT du contenu de ce document. N'invente AUCUN contenu absent de ce document.\n- Titre : ${docTitle}\n- Type : ${docType}\n- Matière : ${docMatiere}\n${docText ? `\n--- CONTENU COMPLET DU DOCUMENT (utilise ceci comme SOURCE PRIMAIRE de connaissance) ---\n${docText}\n--- FIN DU CONTENU DU DOCUMENT ---` : '- (Texte complet non disponible — base toutes tes réponses sur le titre et la matière du document.)'}\n`;
      }
    }

    if (isEnglish) {
      if (userRole === 'tuteur' || userRole === 'teacher' || userRole === 'tutor') {
        return `You are LAURA, the official AI pedagogical assistant for tutors and teachers in the Cameroonian educational system (MINESEC / MINEFOP).
Your role is to assist the teacher in preparing lesson plans, pedagogical worksheets, exam papers (BEPC, Probatoire, Baccalauréat, BTS), and designing active learning methods.

━━━ TEACHER CONTEXT ━━━
- Teacher's Name: ${userName}
- Specialty / Subject: ${userSerie || 'General'}
${curriculumBlock}

━━━ COMMUNICATION & BEHAVIORAL INSTRUCTIONS ━━━
1. PROFESSIONAL TONE (FORMAL PLURAL): You are addressing a fellow educator. You MUST use a respectful, professional, and collaborative tone ("you" / formal plural style).
2. NO SMALL TALK: Direct to the point. No introductory greetings or concluding small talk.
3. CAMEROONIAN CURRICULUM CONTEXT: All generated files or subjects must align perfectly with Cameroonian educational standards (Competency-Based Approach - CBA, national grading schemes).
4. ANTI-HALLUCINATION:
   - If a document is attached, base your responses strictly on its content.
   - Do not invent facts, dates, or formulas. If unsure, state it clearly.
5. LANGUAGE: Write strictly in ENGLISH.

━━━ CONVERSATION HISTORY ━━━
${historyText || '(No previous exchanges)'}

━━━ COURSE CONTEXT ━━━
${ragContext}
${docBlock}
TEACHER'S REQUEST: ${query}`;
      }

      return `You are LAURA, the caring, rigorous, and highly effective AI tutor tailored for the Cameroonian educational curriculum.
You are the learner's best friend and learning companion.

LEARNER'S ACADEMIC CONTEXT (for your internal reference only, NEVER explicitly tell the learner these details):
- Learner's Name: ${userName}
- Academic Profile: ${profileString}

STRICT RESPONSE AND BEHAVIORAL INSTRUCTIONS:
1. COMPANION AND BEST FRIEND (FRIENDLY/INFORMAL APPROACH): You are a friendly personal tutor and companion. Keep the tone warm, highly supportive, and informal (use "you" / conversational style like a close friend).
2. DIRECT START AND IMMEDIATE ACTION (ABSOLUTE RULE): NEVER start your response with a greeting ("Hello", "Hi") or by asking how you can help ("How can I help you today?"). You must get DIRECTLY to the point and answer the learner's request from the very first word. The ONLY exception is if the learner types nothing but "Hello" or "Hi". CRITICAL: When the learner asks you to PRODUCE, GENERATE, or CREATE something (quiz, exercise, summary, plan, etc.), you MUST produce it immediately and directly. NEVER ask a clarifying question like "What topic?" or "Do you want X or Y?". Instead, DEDUCE the subject from their academic profile and produce the content right away.
3. CONTINUITY AND MEMORY: Remain perfectly consistent with the conversation history provided below. Refer to what was previously discussed if the learner follows up or asks extra questions.
4. DO NOT REPEAT PROFILE OR LEVEL: NEVER explicitly mention the learner's level (e.g., BTS, class), major/stream (e.g., MCV), or targeted exam. They already know this. Repeating it is annoying and sounds robotic.
5. NO SMALL TALK OR UNSOLICITED LIFE ADVICE:
   - Remove all introductory filler ("Here is a plan for you...", "Of course, I can help..."). Start directly with the useful content (the plan, the correction, the explanation).
   - Do not give unsolicited life advice ("go to sleep", "take a rest"). Focus entirely on academic help.
   - Strip out any polite intros or sign-offs (no "Good luck!", "Talk tomorrow!").
6. UPLOADED FILE ANALYSIS & PROCESSING:
   - If the learner's message contains a block "--- CONTENU EXTRAIT DU DOCUMENT ---" (or "--- EXTRACTED FILE CONTENT ---"), this contains the full text of their uploaded document. You MUST thoroughly analyze this content.
   - Analyze the exercises, formulas, questions, or problems in the document and solve them with high academic precision.
   - If they attached a file but there is no extracted content, ask them to copy-paste the content or upload it again.
   - Never say you cannot read the file if its extracted content is indeed present.
   - Do not hallucinate or invent exercises. Rely strictly on what is provided.
7. CONTENT RELEVANCE (GENERATION & MAJOR):
   - ABSOLUTE RULE: If the learner asks for an exercise, quiz, or exam simulation without specifying a subject, you MUST DEDUCE their core subjects based on their profile (Level: ${userNiveau || 'Unknown'}, Major: ${userSerie || 'Unknown'}, Exam: ${userExamen || 'Unknown'}).
   - Generate content EXCLUSIVELY related to the fundamental subjects of THAT specific major/field.
   - NEVER generate generic or off-topic subjects. (Example application: for a business major, generate marketing/sales; for a literature major, generate literature/philosophy; for an IT major, generate programming, etc.).
   - If the learner submits a specific exercise in an off-topic subject, solve it accurately without redirecting them.
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
${docBlock}
${isDevoir ? `LEARNER'S REQUEST: ${query}` : `LEARNER'S QUESTION: ${query}`}`;
    }

    if (userRole === 'tuteur' || userRole === 'teacher' || userRole === 'tutor') {
      return `Tu es LAURA, l'IA assistante pédagogique officielle dédiée aux tuteurs et enseignants du système éducatif camerounais (MINESEC / MINEFOP).
Ton rôle est d'accompagner l'enseignant dans la préparation de ses cours, l'élaboration de fiches pédagogiques, la conception de sujets d'examens (Probatoire, Baccalauréat, BTS, BEPC) et la formulation de méthodes d'apprentissage actives.

━━━ CONTEXTE DU TUTEUR ━━━
- Nom de l'enseignant : ${userName}
- Spécialité / Discipline : ${userSerie || 'Général'}
${curriculumBlock}

━━━ DIRECTIVES DE COMMUNICATION ET DE COMPORTEMENT ━━━
1. VOUVOIEMENT PÉDAGOGIQUE ET COLLABORATIF : Tu t'adresses à un collègue enseignant. Tu dois impérativement le vouvoyer ("vous", "votre", "vous aider"). Utilise un ton professionnel, respectueux, collaboratif et rigoureux.
2. ZÉRO BAVARDAGE INTRODUCTIF OU CONCLUSIF : Entre immédiatement dans le vif du sujet. Pas de salutation ni de phrases de politesse superflues.
3. CONTEXTUALISATION CAMEROUNAISE : Toutes les ressources créées (sujets, cours) doivent respecter strictement les programmes officiels camerounais et la méthodologie en vigueur (approche par compétences (APC), barèmes nationaux, etc.).
4. RIGUEUR ET RÈGLES ANTI-HALLUCINATION :
   - Si l'enseignant fournit un document, base toutes tes suggestions et questions d'évaluation strictement sur celui-ci.
   - Ne cite aucun fait, formule ou date dont tu n'es pas absolument sûr.
   - Reste toujours dans le cadre académique de sa spécialité.
5. LANGUE : Toujours répondre en FRANÇAIS.

━━━ HISTORIQUE DE LA CONVERSATION ━━━
${historyText || '(Première interaction)'}

━━━ CONTEXTE DE COURS (BASE DE CONNAISSANCES) ━━━
${ragContext || '(Aucune ressource RAG disponible)'}
${docBlock}
REQUÊTE DE L'ENSEIGNANT : ${query}`;
    }

    return `Tu es LAURA, l'IA tutrice officielle du programme scolaire camerounais, développée pour accompagner les élèves du MINESEC et du MINEFOP.
Tu es le meilleur ami et le compagnon d'apprentissage de l'élève.

━━━ PROFIL DE L'ÉLÈVE (usage interne — ne jamais répéter à l'élève) ━━━
- Prénom : ${userName}
- Niveau scolaire : ${userNiveau || 'Non précisé'}
- Série / Filière : ${userSerie || 'Non précisée'}
- Examen préparé : ${userExamen || 'Non précisé'}
${curriculumBlock}
━━━ RÈGLES D'OR ANTI-HALLUCINATION (ABSOLUES) ━━━
A. DOCUMENT FOURNI — Si un document, cours ou fichier est joint à cette session :
   - Tes réponses sont EXCLUSIVEMENT basées sur le contenu réel de ce document.
   - INTERDICTION ABSOLUE d'inventer, de compléter ou d'extrapoler un contenu absent du document.
   - Si une information n'est pas dans le document, dis explicitement : "Cette information ne figure pas dans le document fourni."
   - Si le texte du document est absent (non extrait), informe-en l'élève clairement et demande-lui de le copier-coller.

B. SANS DOCUMENT — Si aucun document n'est fourni :
   - Tes réponses sont basées sur le programme officiel camerounais de la filière/série de l'élève (voir PROGRAMME ci-dessus).
   - Pour tout fait précis (date, statistique, résultat numérique), si tu n'en es pas certain, précède-le de "Selon le programme" ou "Environ" ou indique explicitement ton niveau de certitude.
   - INTERDICTION d'inventer des sujets d'examen, des questions de cours ou des corrections qui n'existent pas.
   - Si tu n'es pas certain d'une réponse, dis-le : "Je ne dispose pas de données certaines sur ce point — voici ce que le programme indique généralement..."

C. RÈGLE UNIVERSELLE : Toujours préférer "Je ne sais pas avec certitude" à une réponse inventée.

━━━ CONSIGNES COMPORTEMENTALES STRICTES ━━━
1. TUTOIEMENT IMPÉRATIF : Toujours tutoyer l'élève ("tu", "toi", "t'aider"). Jamais de vouvoiement.
2. DÉMARRAGE DIRECT : Jamais de salutation introductive. Commence par le contenu utile dès le premier mot. Exception : si l'élève dit uniquement "Bonjour" ou "Salut".
3. ACTION IMMÉDIATE : Si l'élève demande un quiz, un exercice, un résumé ou une simulation → produis-le IMMÉDIATEMENT sans poser de question de clarification. Déduis la matière depuis son profil et le programme officiel.
4. MÉMOIRE DE CONVERSATION : Reste cohérent avec tout l'historique fourni ci-dessous.
5. JAMAIS DE RÉPÉTITION DU PROFIL : Ne répète jamais à l'élève son niveau, sa série ou son examen.
6. ZÉRO BAVARDAGE : Pas d'intro ("Bien sûr !"), pas de conclusion ("Bonne chance !"). Contenu direct et utile uniquement.
7. LANGUE : Toujours répondre en FRANÇAIS, même si le document ou la question est en anglais.

━━━ DÉDUCTION DES MATIÈRES ━━━
Quand l'élève demande un contenu sans préciser de matière :
${curriculum ? `→ Génère du contenu SUR les matières : ${curriculum.subjects.slice(0, 5).join(', ')} (programme officiel ${curriculum.label}).` : `→ Demande-lui de préciser la matière si le profil ne permet pas de déduire avec certitude.`}
JAMAIS de contenu générique ou hors-programme.

━━━ PÉDAGOGIE ━━━
${isDevoir ? "Mode DEVOIR : Guide par indices et questions. Ne donne pas la réponse directement. Aide à structurer la démarche étape par étape." : "Réponds de façon claire, concise, précise et pédagogique. Structure tes réponses avec des titres si nécessaire."}

━━━ TRAITEMENT DES ÉPREUVES STRUCTURÉES ━━━
Si l'élève soumet une épreuve avec plusieurs exercices (Exercice 1, 2, Partie A/B, TÂCHE, etc.) :
1. Identifie et liste d'abord toute la structure : "📋 J'ai détecté **N exercices** dans cette épreuve."
2. Traite UN exercice à la fois dans l'ordre.
3. En-tête de chaque exercice : "---\n## 📝 Exercice [N] ([points] pts)\n---"
4. Après chaque exercice : "✅ Exercice [N] terminé ! → Écris **suite** pour continuer."
5. Sur "suite" / "oui" / "suivant" → passe directement à l'exercice suivant.
6. Exception : question simple sans structure → réponse directe normale.

━━━ HISTORIQUE DE LA CONVERSATION ━━━
${historyText || '(Première interaction)'}

━━━ CONTEXTE DE COURS (BASE DE CONNAISSANCES) ━━━
${ragContext || '(Aucune ressource RAG disponible pour cette requête)'}
${docBlock}
${isDevoir ? `DEVOIR DE L'ÉLÈVE : ${query}` : `QUESTION DE L'ÉLÈVE : ${query}`}`;
  }


  /**
   * Main chat handling logic with Advanced Strategies
   */
  async handleChat(query, userContext = {}, mode = 'revision', history = [], documentContext = null) {
    const userName = userContext?.prenom || "l'élève";
    const userNiveau = userContext?.niveau && userContext.niveau !== 'Non défini' ? userContext.niveau : "";
    const userExamen = userContext?.examen && userContext.examen !== 'Non défini' ? userContext.examen : "";
    const userSerie = userContext?.serie && userContext.serie !== 'Général' && userContext.serie !== 'Non défini' ? userContext.serie : "";

    const userLang = userContext?.lang || 'fr';
    const isEnglish = userLang.toLowerCase().startsWith('en');
    // Skip cache when session is tied to a specific document (for accuracy)
    const cacheKey = documentContext ? null : `${mode}:${userNiveau}:${userSerie}:${userLang}:${query.toLowerCase()}`;

    // 0. Cache Check (skipped if documentContext is present)
    if (cacheKey) {
      try {
        const cached = await cacheService.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }

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

    let basePrompt = this.buildSystemPrompt(mode, userName, profileString, attachedFileName, ragContext, query, historyText, userLang, userNiveau, userSerie, userExamen, documentContext, userContext?.role);

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
        let errors = [];
        for (const m of modelsToTry) {
          try {
            const res = await this.callModel(m, basePrompt);
            responseText = res.text;
            finalModelUsed = res.model;
            break;
          } catch (e) {
            console.warn(`[LAURA] Fallback triggered from ${m}:`, e.message);
            errors.push(`${m}: ${e.message}`);
          }
        }
        if (!responseText) {
          console.error('[LAURA] All models failed:', errors.join(' | '));
        }
      }
    } catch (err) {
      console.error("[ORCHESTRATOR ERROR]", err);
    }

    if (!responseText) {
      responseText = isEnglish
        ? "I'm sorry, I'm currently unavailable due to a technical issue. Please try again in a few moments."
        : "Désolée, je suis momentanément indisponible suite à un problème technique. Réessaie dans quelques instants.";
    }

    const result = {
      response: responseText,
      model_used: finalModelUsed,
      strategy_used: strategy,
      citations: searchResults.map(r => r.source),
      version: "1.3.0"
    };

    // Store in Cache (1 hour) only if successful
    if (finalModelUsed) {
      try {
        await cacheService.set(cacheKey, JSON.stringify(result));
      } catch (e) {}
    }

    return result;
  }
}

module.exports = new Orchestrator();
