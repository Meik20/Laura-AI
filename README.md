# LAURA AI — Learning AI & Unified Resource Assistant

LAURA est une plateforme d'intelligence artificielle éducative conçue spécifiquement pour le contexte camerounais. Elle combine la puissance des derniers modèles de langage (Claude, Gemini, Grok) avec un moteur de recherche sémantique (RAG) ancré sur les programmes officiels du MINESEC et du GCE Board.

## 🚀 Fonctionnalités Clés
- **Orchestration Multi-Modèles** : Routage intelligent des requêtes vers le modèle le plus adapté (Raisonnement, Vision, Temps réel).
- **RAG Officiel** : Réponses systématiquement vérifiées contre le corpus de manuels et d'annales officiels.
- **Inclusion Numérique** : Interface PWA légère et fallback SMS/USSD pour les zones à faible connectivité.
- **Souveraineté** : Utilisation de modèles locaux (Mistral) pour garantir la confidentialité et réduire les coûts.

## 📥 Ingestion de Données
Pour alimenter LAURA avec les annales et programmes officiels :
1. Dépose tes fichiers PDF dans le dossier `data/corpus/`.
2. Exécute la commande suivante depuis la racine :
   ```bash
   node scripts/ingest.js
   ```
3. Le fichier `data/knowledge.json` sera automatiquement mis à jour avec les nouveaux fragments.

## 🛠 Stack Technique
- **Backend** : Node.js, Express, Railway.
- **Frontend** : React, Vite, PWA.
- **IA** : Anthropic API, Google AI SDK, xAI Grok.
- **Vector Store** : ChromaDB.

## 📁 Structure du Projet
- `/server` : API Gateway et Orchestrateur IA.
- `/client` : Application Web / PWA.
- `/data` : Corpus de documents officiels (PDF, Text).
- `/scripts` : Outils d'ingestion et d'OCR.

---
© 2026 PROJET LAURA · CAMEROUN EDUCATION
# Laura-AI
