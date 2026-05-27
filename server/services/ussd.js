/**
 * LAURA USSD Gateway Service
 * Handles session-based interaction for non-internet users via Africa's Talking
 */

const AfricasTalking = require('africastalking');
const orchestrator = require('./orchestrator');
const cache = require('./cache');

// Initialize Africa's Talking SDK
const AT = AfricasTalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME,
});

const sms = AT.SMS;

class USSDService {
  constructor() {
    // Sessions stored in Redis via cache service (persistent + serverless-safe)
    this.SESSION_TTL = 300; // 5 minutes
  }

  _sessionKey(sessionId) {
    return `ussd_session:${sessionId}`;
  }

  async getSession(sessionId) {
    const raw = await cache.get(this._sessionKey(sessionId));
    return raw ? JSON.parse(raw) : { history: [] };
  }

  async saveSession(sessionId, session) {
    await cache.set(this._sessionKey(sessionId), JSON.stringify(session), this.SESSION_TTL);
  }

  async clearSession(sessionId) {
    await cache.set(this._sessionKey(sessionId), JSON.stringify({ history: [] }), 1);
  }

  /**
   * Send an SMS follow-up with the full LAURA response (since USSD is truncated at 182 chars)
   */
  async sendSmsFollowUp(phoneNumber, fullText) {
    try {
      const message = `📚 LAURA IA\n${fullText.substring(0, 459)}`; // SMS limit
      await sms.send({ to: [phoneNumber], message, from: '15629' });
      console.log(`[USSD] SMS follow-up sent to ${phoneNumber}`);
    } catch (err) {
      console.warn(`[USSD] SMS follow-up failed:`, err.message);
    }
  }

  async handleRequest(phoneNumber, text, sessionId) {
    const parts = text ? text.split('*') : [''];
    const lastInput = parts[parts.length - 1];
    let response = '';

    // ── MAIN MENU ────────────────────────────────────────────────────────────
    if (text === '') {
      await this.clearSession(sessionId);
      response = 'CON Bienvenue sur LAURA IA 🎓\n1. Poser une question\n2. Révision rapide\n3. Infos Examens\n0. Quitter';
    }

    // ── OPTION 1: Question libre ─────────────────────────────────────────────
    else if (text === '1') {
      response = 'CON Saisis ta question scolaire :';
    }
    else if (text.startsWith('1*') && parts.length === 2) {
      const question = lastInput.trim();
      if (!question) return 'CON Question vide. Réessaie :';

      console.log(`[USSD] Question from ${phoneNumber}: ${question}`);

      const session = await this.getSession(sessionId);
      session.history.push({ role: 'user', text: question });

      try {
        const aiResult = await orchestrator.handleChat(
          question,
          { role: 'student', prenom: 'Élève', serie: 'Général' },
          'simple',
          session.history.slice(-4)
        );
        const fullAnswer = aiResult.response || 'Je n\'ai pas pu répondre.';
        const shortAnswer = fullAnswer.substring(0, 130);

        session.history.push({ role: 'laura', text: fullAnswer });
        await this.saveSession(sessionId, session);

        // Send full response via SMS, USSD only shows a preview
        this.sendSmsFollowUp(phoneNumber, fullAnswer);

        response = `END LAURA: ${shortAnswer}...\n📱 Réponse complète envoyée par SMS.`;
      } catch (err) {
        console.error('[USSD] AI error:', err.message);
        response = 'END Erreur IA. Réessaie dans quelques instants.';
      }
    }

    // ── OPTION 2: Révision rapide ────────────────────────────────────────────
    else if (text === '2') {
      response = 'CON Choisis une matière :\n1. Mathématiques\n2. Physique-Chimie\n3. SVT\n4. Histoire-Géo\n5. Français';
    }
    else if (text.startsWith('2*')) {
      const subjects = { '1': 'Mathématiques', '2': 'Physique-Chimie', '3': 'SVT', '4': 'Histoire-Géo', '5': 'Français' };
      const subject = subjects[lastInput];
      if (!subject) {
        response = 'END Choix invalide. À bientôt !';
      } else {
        try {
          const prompt = `Donne-moi une notion essentielle et un exercice type pour ${subject} niveau Terminale, de manière très concise.`;
          const aiResult = await orchestrator.handleChat(prompt, { role: 'student', serie: 'Général' }, 'simple', []);
          const shortAnswer = (aiResult.response || '').substring(0, 130);
          this.sendSmsFollowUp(phoneNumber, aiResult.response || '');
          response = `END 📚 ${subject}:\n${shortAnswer}...\n📱 Détails envoyés par SMS.`;
        } catch (err) {
          response = 'END Erreur. Réessaie plus tard.';
        }
      }
    }

    // ── OPTION 3: Infos Examens ──────────────────────────────────────────────
    else if (text === '3') {
      response = 'END 📅 Examens 2026 :\nBEPC : 02-06 Juin\nBAC A/C/D : 10-17 Juin\nBAC G/TI : 08-15 Juin\nGCE O/L : 11-18 Juin\nBonne chance ! 💪';
    }

    // ── QUITTER ──────────────────────────────────────────────────────────────
    else if (text === '0') {
      await this.clearSession(sessionId);
      response = 'END Bonne révision ! LAURA IA est toujours là pour vous. 🌟';
    }

    else {
      response = 'END Session terminée. Travaillez bien ! 📖';
    }

    return response;
  }
}

module.exports = new USSDService();
