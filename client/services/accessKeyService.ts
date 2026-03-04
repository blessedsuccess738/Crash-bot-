import { db } from './firebaseClient';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Mock implementation for demo purposes if DB is not connected
const MOCK_KEYS = new Map();

export const validateKey = async (key: string): Promise<boolean> => {
  if (!db) {
    // Mock validation
    return key.startsWith('ACCESS-') || key === 'DEMO-KEY';
  }

  try {
    const q = query(collection(db, 'accessKeys'), where('key', '==', key), where('active', '==', true));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error validating key:", error);
    return false;
  }
};

export const generateAccessKeyForUser = async (userId: string): Promise<string> => {
  const newKey = `ACCESS-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  
  if (!db) {
    MOCK_KEYS.set(newKey, userId);
    return newKey;
  }

  try {
    await addDoc(collection(db, 'accessKeys'), {
      key: newKey,
      userId,
      createdAt: new Date(),
      active: true
    });
    return newKey;
  } catch (error) {
    console.error("Error generating key:", error);
    throw error;
  }
};
