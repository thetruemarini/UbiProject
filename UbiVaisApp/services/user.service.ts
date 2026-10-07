// services/user.service.ts
import { db } from '@/config/firebase';
import { userConverter } from '@/services/firestore-converters';
import { doc, getDoc } from 'firebase/firestore';

class UserService {
  async getUserById(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId).withConverter(userConverter));
      if (!userDoc.exists()) {
        return { success: false, error: 'Utente non trovato' };
      }
      return { success: true, user: userDoc.data() };
    } catch (error: any) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new UserService();
