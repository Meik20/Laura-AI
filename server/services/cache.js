const redis = require('redis');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: false
      }
    });
    
    this.client.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.warn('⚠️ Redis non connecté (ECONNREFUSED). Basculement automatique sur le cache RAM interne de LAURA.');
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
      .catch(e => console.warn('⚠️ Impossible de se connecter à Redis. Cache RAM interne activé avec succès.'));
  }

  async get(key) {
    if (this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (e) {
        return null;
      }
    } else {
      const item = this.memoryCache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        this.memoryCache.delete(key);
        return null;
      }
      return item.value;
    }
  }

  async set(key, value, expiry = 3600) {
    if (this.isConnected) {
      try {
        await this.client.set(key, value, {
          EX: expiry
        });
      } catch (e) {
        console.error('Redis Set Error', e);
      }
    } else {
      this.memoryCache.set(key, {
        value: value,
        expiry: Date.now() + expiry * 1000
      });
    }
  }
}

module.exports = new CacheService();
