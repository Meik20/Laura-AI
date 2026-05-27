const { auth } = require('../services/firebase');

/**
 * Express middleware to verify Firebase ID tokens.
 */
async function checkAuth(req, res, next) {
  // If Firebase Admin SDK is not initialized, bypass to prevent local crash
  if (!auth) {
    console.warn('[SECURITY WARNING] Firebase Auth Admin not initialized. Bypassing token check.');
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé. Token manquant ou mal formé.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[SECURITY ERROR] Token validation failed:', error.message);
    return res.status(403).json({ error: 'Accès refusé. Token invalide ou expiré.' });
  }
}

module.exports = checkAuth;
