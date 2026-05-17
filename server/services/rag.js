const { ChromaClient } = require('chromadb');
const fs = require('fs');
const path = require('path');

class RAGService {
  constructor() {
    this.chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
    this.client = new ChromaClient({ path: this.chromaUrl });
    this.collectionName = "laura_official_corpus";
    this.knowledgePath = path.join(__dirname, '../../data/knowledge.json');
  }

  /**
   * Search for relevant chunks using ChromaDB (Vector Search)
   */
  async search(query, limit = 5) {
    console.log(`[LAURA RAG] Searching for: ${query}`);
    
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit,
      });

      if (results.ids[0].length > 0) {
        return results.ids[0].map((id, index) => ({
          id,
          content: results.documents[0][index],
          source: results.metadatas[0][index].source || 'Inconnu',
          score: results.distances ? (1 - results.distances[0][index]) : 1
        }));
      }
    } catch (err) {
      console.warn('[LAURA RAG] ChromaDB not available or collection missing, falling back to JSON.');
      return this.fallbackSearch(query, limit);
    }

    return [];
  }

  /**
   * Fallback keyword search on JSON file
   */
  async fallbackSearch(query, limit) {
    if (fs.existsSync(this.knowledgePath)) {
      const data = JSON.parse(fs.readFileSync(this.knowledgePath, 'utf8'));
      const keywords = query.toLowerCase().split(' ');
      return data.filter(item => 
        keywords.some(word => word.length > 3 && item.content.toLowerCase().includes(word))
      ).slice(0, limit);
    }
    return [];
  }

  /**
   * Add new documents to ChromaDB with full metadata schema
   */
  async addDocuments(documents) {
    try {
      const collection = await this.client.getOrCreateCollection({ name: this.collectionName });
      
      const ids = documents.map(d => d.id);
      const docs = documents.map(d => d.content);
      const metadatas = documents.map(d => {
        // Create a copy of all fields except content and id for metadata
        const { content, id, ...meta } = d;
        return meta;
      });

      await collection.add({
        ids: ids,
        metadatas: metadatas,
        documents: docs,
      });
      console.log(`[LAURA RAG] Succès : ${documents.length} fragments certifiés ajoutés à ChromaDB.`);
    } catch (err) {
      console.error('[LAURA RAG] Erreur lors de l\'ajout à ChromaDB :', err);
    }
  }

  /**
   * Ingest a new document into the vector store
   */
  async ingest(document) {
    console.log(`[LAURA RAG] Ingesting document: ${document.id}`);
    // TODO: Implement ingestion logic (Text extraction -> Chunking -> Embedding -> Storage)
    return { success: true };
  }
}

module.exports = new RAGService();
