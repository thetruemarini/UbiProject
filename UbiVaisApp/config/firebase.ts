// config/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence esiste a runtime ma manca nelle definizioni TypeScript di Firebase 12.x
import { getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Le variabili EXPO_PUBLIC_* vanno lette con accesso statico (process.env.NOME):
// Expo le sostituisce nel bundle solo in questa forma
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variabile d'ambiente mancante: ${name}. Aggiungila al file .env (vedi .env.example).`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requireEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Auth con persistenza React Native usando AsyncStorage
// Questo è NECESSARIO per Firebase 12.x in React Native/Expo
// per mantenere l'utente loggato dopo il riavvio dell'app
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inizializza Firestore ignorando i campi undefined
// (altrimenti Firestore lancia "Unsupported field value: undefined")
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

export { app, auth, db };
