import { db } from './firebaseClient';
import { collection, addDoc, orderBy, limit, query, getDocs } from 'firebase/firestore';

export const fetchPastCrashRounds = async () => {
  // In a real app, this would fetch from Firestore or an external API
  // For now, we return mock data
  return Array.from({ length: 20 }, () => ({
    multiplier: (Math.random() * 10 + 1).toFixed(2),
    timestamp: Date.now() - Math.random() * 1000000
  }));
};

export const saveCrashRound = async (multiplier: number) => {
  if (!db) return;
  
  try {
    await addDoc(collection(db, 'crashHistory'), {
      multiplier,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error saving crash round:", error);
  }
};
