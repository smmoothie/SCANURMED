import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

function readEnv(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

const apiKey = readEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const authDomain = readEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
const projectId = readEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const storageBucket = readEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
const messagingSenderId = readEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const appId = readEnv(import.meta.env.VITE_FIREBASE_APP_ID);

const firebaseConfig: FirebaseOptions | null =
  apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId
    ? {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
        measurementId: readEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
      }
    : null;

export const isFirebaseConfigured = firebaseConfig !== null;

export const app = firebaseConfig
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

const firestoreDatabaseId = readEnv(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);
export const db: Firestore | null = app
  ? firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app)
  : null;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured for this deployment.');
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!db) {
    throw new Error('Firebase Firestore is not configured for this deployment.');
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error('Firebase Storage is not configured for this deployment.');
  }
  return storage;
}
