/**
 * LAURA USSD Gateway Service
 * Handles session-based interaction for non-internet users
 */

const orchestrator = require('./orchestrator');

class USSDService {
  constructor() {
    this.sessions = new Map(); // In-memory session storage (use Redis in production)
  }

  async handleRequest(phoneNumber, text, sessionId) {
    const parts = text.split('*');
    const level = parts.length;
    const lastInput = parts[parts.length - 1];

    let response = "";

    // USSD Menu Logic
    if (text === "") {
      // First dial
      response = "CON Bienvenue sur LAURA IA\n1. Poser une question\n2. Infos Examens\n3. Quitter";
    } 
    else if (text === "1") {
      // Ask for question
      response = "CON Saisis ta question scolaire :";
    }
    else if (text.startsWith("1*")) {
      // Process question
      const question = lastInput;
      console.log(`[USSD] Question from ${phoneNumber}: ${question}`);
      
      const aiResult = await orchestrator.handleChat(question);
      // USSD limit is small, we truncate and simplify
      const shortResponse = aiResult.response.substring(0, 140) + "...";
      response = `END LAURA: ${shortResponse}`;
    }
    else if (text === "2") {
      response = "END Infos Examens:\nBAC: Juin 2026\nBEPC: Mai 2026\nConcours ENS: En cours";
    }
    else {
      response = "END Session terminée. Travaillez bien !";
    }

    return response;
  }
}

module.exports = new USSDService();
