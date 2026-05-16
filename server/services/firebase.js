const admin = require('firebase-admin');

/**
 * LAURA Firebase Admin Service
 * Handles user profiles, history, and educational tracking
 */

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🚀 Firebase Admin Initialized');
} else {
  console.warn('⚠️ Firebase Service Account missing. Auth features disabled.');
}

const db = serviceAccount ? admin.firestore() : null;
const auth = serviceAccount ? admin.auth() : null;

module.exports = { admin, db, auth };
