import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBaHzZUazI4qzQG1xZP2dC4sCqj4WOEpl0",
  authDomain: "wasla-link.firebaseapp.com",
  projectId: "wasla-link",
  storageBucket: "wasla-link.firebasestorage.app",
  messagingSenderId: "678233300615",
  appId: "1:678233300615:web:f956c78436006f19e6e222",
  measurementId: "G-YXBFVWN4CE"
};

export const app = initializeApp(firebaseConfig);

// Initialize Firebase App Check for security validation BEFORE other services
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
if (typeof window !== 'undefined') {
  try {
    // For local development, set: (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Ld_PlaceholderKeyForAppCheck_Web'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn('App Check failed to initialize (ReCAPTCHA Key placeholder):', err);
  }
}

export const auth = getAuth(app);

// Enable offline persistence
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const storage = getStorage(app);


export const sanitizeFirestoreData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)).filter(val => val !== undefined);
  } else if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, sanitizeFirestoreData(value)])
    );
  }
  return data;
};

import { setDoc, addDoc, updateDoc, DocumentReference, CollectionReference } from 'firebase/firestore';

export const safeSetDoc = (ref: DocumentReference<any>, data: any, options?: any) => {
  return options ? setDoc(ref, sanitizeFirestoreData(data), options) : setDoc(ref, sanitizeFirestoreData(data));
};

export const safeAddDoc = (ref: CollectionReference<any>, data: any) => {
  return addDoc(ref, sanitizeFirestoreData(data));
};

export const safeUpdateDoc = (ref: DocumentReference<any>, data: any) => {
  return updateDoc(ref, sanitizeFirestoreData(data));
};

import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
export const functions = getFunctions(app);

if (import.meta.env.DEV) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (e) {
    console.warn('Functions emulator connection failed:', e);
  }
}

