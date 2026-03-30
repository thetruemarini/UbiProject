// services/itinerary.service.ts
import { db } from '@/config/firebase';
import {
  FillerBox,
  Itinerary,
  ItineraryBox,
  ItineraryDay,
  ItineraryItem,
  ItineraryStats,
  SavedBox,
} from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

class ItineraryService {

  // ─────────────────────────────────────────
  // BOX HELPERS
  // ─────────────────────────────────────────

  generateBoxId(): string {
    return doc(collection(db, '_')).id;
  }

  calculateStats(days: ItineraryDay[]): ItineraryStats {
    let totalDurationMinutes = 0;
    let totalBoxes = 0;
    const categoriesSet = new Set<string>();

    for (const day of days) {
      for (const item of day.items) {
        if (item.type === 'box' && item.boxData) {
          totalBoxes++;
          if (item.boxData.duration) totalDurationMinutes += item.boxData.duration;
          if (item.boxData.category) categoriesSet.add(item.boxData.category);
        }
        if (item.type === 'filler' && item.fillerData?.duration) {
          totalDurationMinutes += item.fillerData.duration;
        }
      }
    }

    return {
      totalDurationMinutes,
      totalBoxes,
      categories: Array.from(categoriesSet) as any[],
    };
  }

  // ─────────────────────────────────────────
  // SAVED BOXES
  // ─────────────────────────────────────────

  async saveBox(userId: string, box: ItineraryBox, sourcePostId?: string) {
    try {
      const savedBoxRef = doc(db, 'users', userId, 'savedBoxes', box.id);
      const savedBox: SavedBox = {
        id: box.id,
        userId,
        box,
        savedAt: new Date(),
        sourcePostId,
      };
      await setDoc(savedBoxRef, {
        ...savedBox,
        savedAt: Timestamp.fromDate(savedBox.savedAt),
        box: {
          ...box,
          createdAt: Timestamp.fromDate(box.createdAt),
        },
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error saving box:', error);
      return { success: false, error: error.message };
    }
  }

  async unsaveBox(userId: string, boxId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'savedBoxes', boxId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSavedBoxes(userId: string): Promise<SavedBox[]> {
    try {
      const q = query(
        collection(db, 'users', userId, 'savedBoxes'),
        orderBy('savedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          savedAt: data.savedAt.toDate(),
          box: { ...data.box, createdAt: data.box.createdAt.toDate() },
        } as SavedBox;
      });
    } catch (error) {
      console.error('Error getting saved boxes:', error);
      return [];
    }
  }

  async isBoxSaved(userId: string, boxId: string): Promise<boolean> {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId, 'savedBoxes', boxId));
      return docSnap.exists();
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────
  // ITINERARIES CRUD
  // ─────────────────────────────────────────

  async createItinerary(
    userId: string,
    title: string,
    totalDays: number,
    destination?: string
  ) {
    try {
      const days: ItineraryDay[] = Array.from({ length: totalDays }, (_, i) => ({
        dayNumber: i + 1,
        items: [],
      }));

      const newItinerary: Omit<Itinerary, 'id'> = {
        userId,
        title,
        destination,
        totalDays,
        isPublic: false,
        days,
        stats: { totalDurationMinutes: 0, totalBoxes: 0, categories: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ref = await addDoc(collection(db, 'itineraries'), {
        ...newItinerary,
        createdAt: Timestamp.fromDate(newItinerary.createdAt),
        updatedAt: Timestamp.fromDate(newItinerary.updatedAt),
      });

      return { success: true, itineraryId: ref.id };
    } catch (error: any) {
      console.error('Error creating itinerary:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserItineraries(userId: string): Promise<Itinerary[]> {
    try {
      const q = query(
        collection(db, 'itineraries'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Itinerary;
      });
    } catch (error) {
      console.error('Error getting itineraries:', error);
      return [];
    }
  }

  async getItinerary(itineraryId: string): Promise<Itinerary | null> {
    try {
      const docSnap = await getDoc(doc(db, 'itineraries', itineraryId));
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Itinerary;
    } catch (error) {
      console.error('Error getting itinerary:', error);
      return null;
    }
  }

  // Aggiorna i giorni (chiamato dopo ogni modifica drag&drop)
  async updateItineraryDays(itineraryId: string, days: ItineraryDay[]) {
    try {
      const stats = this.calculateStats(days);
      await updateDoc(doc(db, 'itineraries', itineraryId), {
        days,
        stats,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating itinerary days:', error);
      return { success: false, error: error.message };
    }
  }

  async updateItineraryMeta(
    itineraryId: string,
    data: Partial<Pick<Itinerary, 'title' | 'description' | 'destination' | 'isPublic' | 'coverImage' | 'startDate' | 'endDate'>>
  ) {
    try {
      await updateDoc(doc(db, 'itineraries', itineraryId), {
        ...data,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteItinerary(itineraryId: string) {
    try {
      await deleteDoc(doc(db, 'itineraries', itineraryId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────
  // AGGIUNTA BOX A ITINERARIO
  // ─────────────────────────────────────────

  async addBoxToDay(
    itineraryId: string,
    dayNumber: number,
    box: ItineraryBox | FillerBox,
    type: 'box' | 'filler'
  ) {
    try {
      const itinerary = await this.getItinerary(itineraryId);
      if (!itinerary) return { success: false, error: 'Itinerario non trovato' };

      const updatedDays = itinerary.days.map((day) => {
        if (day.dayNumber !== dayNumber) return day;

        const newItem: ItineraryItem = {
          order: day.items.length,
          type,
          ...(type === 'box'
            ? { boxId: box.id, boxData: box as ItineraryBox }
            : { fillerId: box.id, fillerData: box as FillerBox }),
        };

        return { ...day, items: [...day.items, newItem] };
      });

      return this.updateItineraryDays(itineraryId, updatedDays);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Riordina items in un giorno (chiamato dopo drag&drop)
  async reorderDayItems(
    itineraryId: string,
    dayNumber: number,
    reorderedItems: ItineraryItem[]
  ) {
    try {
      const itinerary = await this.getItinerary(itineraryId);
      if (!itinerary) return { success: false, error: 'Itinerario non trovato' };

      const updatedDays = itinerary.days.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const itemsWithOrder = reorderedItems.map((item, idx) => ({
          ...item,
          order: idx,
        }));
        return { ...day, items: itemsWithOrder };
      });

      return this.updateItineraryDays(itineraryId, updatedDays);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default new ItineraryService();
