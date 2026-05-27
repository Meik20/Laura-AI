const cacheService = require('../services/cache');

/**
 * Custom Serverless-safe Rate Limiter middleware using Redis (with in-memory fallback).
 * 
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 minute)
 * @param {number} options.max - Max number of requests allowed in the window (default: 15)
 * @param {string} options.message - Error message to return when rate limit is exceeded
 */
function rateLimiter({ 
  windowMs = 60 * 1000, 
  max = 15, 
  message = 'Trop de requêtes. Veuillez patienter avant de réessayer.' 
} = {}) {
  return async (req, res, next) => {
    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const cleanIp = Array.isArray(ip) ? ip[0] : ip;
    const route = req.path;
    const key = `rate_limit:${cleanIp}:${route}`;

    try {
      const current = await cacheService.get(key);
      
      if (current === null) {
        // Initialize request counter
        await cacheService.set(key, '1', Math.ceil(windowMs / 1000));
        return next();
      }

      const count = parseInt(current, 10);
      if (count >= max) {
        console.warn(`[SECURITY WARNING] Rate limit exceeded for IP: ${cleanIp} on route: ${route}`);
        return res.status(429).json({ error: message });
      }

      // Increment counter (maintain the remaining lifetime of the key if possible,
      // but since custom map uses full expiry, we approximate by refreshing)
      await cacheService.set(key, (count + 1).toString(), Math.ceil(windowMs / 1000));
      next();
    } catch (err) {
      console.error('[RATE LIMITER ERROR] Fallback to next middleware:', err.message);
      next();
    }
  };
}

module.exports = rateLimiter;
