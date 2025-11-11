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
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class AuthService {
  // Registrazione nuovo utente
  async signUp(email: string, password: string, username: string, displayName: string) {
    try {
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
      return { success: false, error: error.message };
    }
  }

  // Login
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      return { success: true, user: userData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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