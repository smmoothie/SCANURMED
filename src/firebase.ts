import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import fallbackConfig from '../firebase-applet-config.json';

// Allow environment variables (VITE_FIREBASE_*) to override fallbackConfig
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID !== undefined
      ? import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID
      : fallbackConfig.firestoreDatabaseId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId || '',
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || fallbackConfig.oAuthClientId || '',
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || fallbackConfig.recaptchaSiteKey || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use named database if specified and valid, otherwise connect to (default)
const dbId = firebaseConfig.firestoreDatabaseId?.trim();
export const db = dbId && dbId !== '(default)' && dbId.length > 0
  ? getFirestore(app, dbId)
  : getFirestore(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase is offline or connecting.');
    } else {
      console.warn('Firebase connection notice:', error instanceof Error ? error.message : error);
    }
  }
}

testConnection();
