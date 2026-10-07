// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { authPersistence } from './auth-persistence';

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

// Inizializza Auth con la persistenza della piattaforma:
// AsyncStorage su iOS/Android (auth-persistence.native.ts), localStorage sul web (auth-persistence.ts)
const auth = initializeAuth(app, {
  persistence: authPersistence
});

// Inizializza Firestore ignorando i campi undefined
// (altrimenti Firestore lancia "Unsupported field value: undefined")
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

export { app, auth, db };
