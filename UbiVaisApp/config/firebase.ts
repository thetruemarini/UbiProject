// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

// Inizializza Auth (la persistenza è gestita automaticamente da Firebase)
const auth = getAuth(app);

// Inizializza Firestore
const db = getFirestore(app);

// Inizializza Storage
const storage = getStorage(app);

export { app, auth, db, storage };
