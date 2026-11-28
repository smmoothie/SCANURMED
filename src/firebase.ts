import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

function requiredFirebaseEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }
  return value.trim();
}

const firebaseConfig: FirebaseOptions = {
  apiKey: requiredFirebaseEnv('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: requiredFirebaseEnv(
    'VITE_FIREBASE_AUTH_DOMAIN',
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: requiredFirebaseEnv(
    'VITE_FIREBASE_PROJECT_ID',
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
  ),
  storageBucket: requiredFirebaseEnv(
    'VITE_FIREBASE_STORAGE_BUCKET',
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  ),
  messagingSenderId: requiredFirebaseEnv(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: requiredFirebaseEnv('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.trim();
export const db =
  firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);
