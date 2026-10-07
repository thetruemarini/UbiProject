// config/auth-persistence.native.ts - Persistenza Auth su iOS/Android
// Mantiene l'utente loggato dopo il riavvio dell'app usando AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-expect-error - getReactNativePersistence esiste a runtime ma manca nelle definizioni TypeScript di Firebase 12.x
import { getReactNativePersistence } from 'firebase/auth';

export const authPersistence = getReactNativePersistence(AsyncStorage);
