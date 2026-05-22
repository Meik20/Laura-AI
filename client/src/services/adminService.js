import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

/**
 * Generate a random invitation code
 * Format: LAURA-XXXX-XXXX (alphanumeric)
 */
export const generateInvitationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'LAURA';
  for (let i = 0; i < 8; i++) {
    if (i % 5 === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create a new tutor invitation code
 */
export const createInvitationCode = async (data) => {
  try {
    const code = data.code || generateInvitationCode();
    const docRef = await addDoc(collection(db, 'tutor_invitations'), {
      code: code.toUpperCase(),
      createdAt: new Date().toISOString(),
      usedAt: null,
      usedBy: null,
      email: data.email || null,
      notes: data.notes || null,
      status: 'active', // active, used, expired
      expiresAt: data.expiresAt || null,
    });
    return { id: docRef.id, code: code.toUpperCase() };
  } catch (error) {
    console.error('Error creating invitation code:', error);
    throw error;
  }
};

/**
 * Get all invitation codes
 */
export const getInvitationCodes = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'tutor_invitations'));
    const codes = [];
    snapshot.forEach((doc) => {
      codes.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return codes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
    throw error;
  }
};

/**
 * Delete an invitation code
 */
export const deleteInvitationCode = async (codeId) => {
  try {
    await deleteDoc(doc(db, 'tutor_invitations', codeId));
  } catch (error) {
    console.error('Error deleting invitation code:', error);
    throw error;
  }
};

/**
 * Validate invitation code (check if it exists and is active)
 */
export const validateInvitationCode = async (code) => {
  try {
    const q = query(
      collection(db, 'tutor_invitations'),
      where('code', '==', code.toUpperCase()),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { valid: false, message: 'Code invalide ou expiré' };
    }

    const codeDoc = snapshot.docs[0];
    const data = codeDoc.data();

    // Check expiration if applicable
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return { valid: false, message: 'Code expiré' };
    }

    return { valid: true, code: code.toUpperCase(), id: codeDoc.id, data };
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return { valid: false, message: 'Erreur lors de la validation du code' };
  }
};

/**
 * Mark invitation code as used
 */
export const markCodeAsUsed = async (codeId, userId, email) => {
  try {
    await updateDoc(doc(db, 'tutor_invitations', codeId), {
      status: 'used',
      usedAt: new Date().toISOString(),
      usedBy: userId,
      usedByEmail: email,
    });
  } catch (error) {
    console.error('Error marking code as used:', error);
    throw error;
  }
};

/**
 * Bulk create invitation codes
 */
export const createBulkInvitationCodes = async (count, expiresAt = null) => {
  try {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = generateInvitationCode();
      const docRef = await addDoc(collection(db, 'tutor_invitations'), {
        code: code.toUpperCase(),
        createdAt: new Date().toISOString(),
        usedAt: null,
        usedBy: null,
        email: null,
        notes: null,
        status: 'active',
        expiresAt: expiresAt || null,
      });
      codes.push({ id: docRef.id, code: code.toUpperCase() });
    }
    return codes;
  } catch (error) {
    console.error('Error creating bulk invitation codes:', error);
    throw error;
  }
};
