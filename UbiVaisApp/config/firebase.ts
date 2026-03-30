// config/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence esiste a runtime ma manca nelle definizioni TypeScript di Firebase 12.x
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Sostituisci con le tue credenziali Firebase
// Le trovi in: Firebase Console → Impostazioni progetto → Le tue app → Config
const firebaseConfig = {
  apiKey: "AIzaSyBDZm1af5FB5SZk95-IWphIIajLv5kBB04",
  authDomain: "ubivais.firebaseapp.com",
  projectId: "ubivais",
  storageBucket: "ubivais.firebasestorage.app",
  messagingSenderId: "86886992139",
  appId: "1:86886992139:web:604684af1d7030562f3a0e",
  measurementId: "G-59DQEQ2MCV"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Auth con persistenza React Native usando AsyncStorage
// Questo è NECESSARIO per Firebase 12.x in React Native/Expo
// per mantenere l'utente loggato dopo il riavvio dell'app
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inizializza Firestore
const db = getFirestore(app);

// Inizializza Storage
const storage = getStorage(app);

export { app, auth, db, storage };
