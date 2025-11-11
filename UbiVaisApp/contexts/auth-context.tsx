// contexts/auth-context.tsx
import AuthService from '@/services/auth.service';
import { User } from '@/types';
import { User as FirebaseUser } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Observer per stato autenticazione
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Utente loggato - carica dati Firestore
        const userData = await AuthService.getUserData(fbUser.uid);
        setUser(userData ?? null); // Converte undefined in null
      } else {
        // Utente non loggato
        setUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const result = await AuthService.signUp(email, password, username, displayName);
    if (result.success) {
      setUser(result.user ?? null);
    }
    return result;
  };

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn(email, password);
    if (result.success) {
      setUser(result.user ?? null);
    }
    return result;
  };

  const logout = async () => {
    const result = await AuthService.logout();
    if (result.success) {
      setUser(null);
      setFirebaseUser(null);
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizzato per usare il context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
}