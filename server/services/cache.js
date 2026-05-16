const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.connect().then(() => console.log('🚀 Redis Connected for LAURA Cache'));
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (e) {
      return null;
    }
  }

  async set(key, value, expiry = 3600) {
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
