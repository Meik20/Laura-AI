const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.client.on('error', (err) => {
      // Éviter le spam dans les logs si la connexion est refusée
      if (err.code === 'ECONNREFUSED') {
        console.warn('⚠️ Redis non connecté (ECONNREFUSED). Le cache sera désactivé.');
      } else {
        console.error('Redis Client Error', err);
      }
    });
    
    this.isConnected = false;
    this.client.connect()
      .then(() => {
        this.isConnected = true;
        console.log('🚀 Redis Connected for LAURA Cache');
      })
      .catch(e => console.warn('⚠️ Impossible de se connecter à Redis.'));
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (e) {
      return null;
    }
  }

  async set(key, value, expiry = 3600) {
    if (!this.isConnected) return;
    try {
      await this.client.set(key, value, {
        EX: expiry
      });
    } catch (e) {
      console.error('Redis Set Error', e);
    }
  }
}

module.exports = new CacheService();
