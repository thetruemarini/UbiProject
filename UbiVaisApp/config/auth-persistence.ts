// config/auth-persistence.ts - Persistenza Auth sul web
// getReactNativePersistence esiste solo nella build React Native di firebase/auth:
// sul web (e nel rendering statico lato Node) si usa il localStorage del browser.
// Dove non è disponibile, Firebase ripiega automaticamente sulla memoria.
import { browserLocalPersistence } from 'firebase/auth';

export const authPersistence = browserLocalPersistence;
