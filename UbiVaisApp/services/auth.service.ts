// services/auth.service.ts
import { auth, db } from '@/config/firebase';
import { User } from '@/types';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper per tradurre errori Firebase in messaggi leggibili
function getFirebaseErrorMessage(error: any): string {
  if (!error || typeof error.code !== 'string') {
    return 'Si è verificato un errore imprevisto';
  }

  const errorCode = error.code as string;

  // Errori di autenticazione comuni in Firebase 12.x
  const errorMessages: Record<string, string> = {
    // Errori Email/Password
    'auth/email-already-in-use': 'Questa email è già registrata. Prova ad accedere.',
    'auth/invalid-email': 'Formato email non valido',
    'auth/weak-password': 'La password è troppo debole. Usa almeno 6 caratteri.',
    'auth/user-not-found': 'Email o password non corretti',
    'auth/wrong-password': 'Email o password non corretti',
    'auth/invalid-credential': 'Credenziali non valide. Verifica email e password.',
    'auth/too-many-requests': 'Troppi tentativi falliti. Riprova più tardi.',

    // Errori di rete e configurazione
    'auth/network-request-failed': 'Errore di connessione. Controlla la tua rete.',
    'auth/operation-not-allowed': 'Operazione non consentita. Contatta il supporto.',
    'auth/app-deleted': 'App Firebase non trovata. Riavvia l\'applicazione.',

    // Errori utente
    'auth/user-disabled': 'Questo account è stato disabilitato.',
    'auth/requires-recent-login': 'Richiesta autenticazione recente. Effettua nuovamente il login.',

    // Altri errori comuni
    'auth/internal-error': 'Errore interno. Riprova tra qualche minuto.',
    'auth/popup-closed-by-user': 'Operazione annullata dall\'utente.',
  };

  return errorMessages[errorCode] || `Errore: ${error.message || 'Operazione non riuscita'}`;
}

class AuthService {
  // Registrazione nuovo utente
  async signUp(email: string, password: string, username: string, displayName: string) {
    try {
      // Validazione lato client
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Inserisci un indirizzo email valido' };
      }
      if (password.length < 6) {
        return { success: false, error: 'La password deve contenere almeno 6 caratteri' };
      }
      if (!username || username.length < 3) {
        return { success: false, error: 'Lo username deve contenere almeno 3 caratteri' };
      }

      // Crea utente in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Aggiorna profilo
      await updateProfile(firebaseUser, { displayName });

      // Crea documento utente in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        username: username.toLowerCase(),
        displayName,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { success: false, error: getFirebaseErrorMessage(error) };
    }
  }

  // Login
  async signIn(email: string, password: string) {
    try {
      // Validazione lato client
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Inserisci un indirizzo email valido' };
      }
      if (!password) {
        return { success: false, error: 'Inserisci la password' };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { success: false, error: getFirebaseErrorMessage(error) };
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: getFirebaseErrorMessage(error) };
    }
  }

  // Get dati utente da Firestore
  async getUserData(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Observer per stato auth
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get utente corrente
  getCurrentUser() {
    return auth.currentUser;
  }
}

export default new AuthService();