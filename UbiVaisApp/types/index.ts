// types/index.ts

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profilePic?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  destination: string;
  thumbnail: string;
  viewed: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────
// BOX TYPES
// ─────────────────────────────────────────

export type BoxCategory =
  | 'food'
  | 'experience'
  | 'sport'
  | 'culture'
  | 'nature'
  | 'nightlife'
  | 'shopping'
  | 'accommodation'
  | 'transport'
  | 'other';

export type FillerType =
  | 'travel'
  | 'free_time'
  | 'sleep'
  | 'meal'
  | 'break';

export type TransportMode =
  | 'car'
  | 'train'
  | 'plane'
  | 'foot'
  | 'bike'
  | 'bus'
  | 'boat';

export interface BoxLocation {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  googlePlaceId?: string;
}

export interface ItineraryBox {
  id: string;
  title: string;
  description: string;
  category: BoxCategory;
  location?: BoxLocation;
  rating?: number;          // 1-5
  duration?: number;        // minuti stimati
  estimatedCost?: number;   // €
  photos?: string[];        // URL immagini
  tips?: string;
  tags?: string[];
  // Metadati
  createdBy: string;        // userId
  sourcePostId?: string;    // se derivato da un post
  createdAt: Date;
}

export interface FillerBox {
  id: string;
  type: FillerType;
  title: string;
  duration?: number;        // minuti
  notes?: string;
  transportMode?: TransportMode;
  distanceKm?: number;
  createdBy: string;
  createdAt: Date;
}

export interface SavedBox {
  id: string;
  userId: string;
  box: ItineraryBox;
  savedAt: Date;
  sourcePostId?: string;
}

// ─────────────────────────────────────────
// ITINERARY TYPES
// ─────────────────────────────────────────

export type ItineraryItemType = 'box' | 'filler';

export interface ItineraryItem {
  order: number;
  type: ItineraryItemType;
  boxId?: string;           // se type === 'box'
  fillerId?: string;        // se type === 'filler'
  // Dati embedded per evitare troppe query
  boxData?: ItineraryBox;
  fillerData?: FillerBox;
}

export interface ItineraryDay {
  dayNumber: number;        // 1, 2, 3...
  date?: string;            // ISO string opzionale
  title?: string;           // es: "Giorno 1 - Centro Storico"
  items: ItineraryItem[];
}

export interface ItineraryStats {
  totalDurationMinutes: number;
  totalBoxes: number;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  categories: BoxCategory[];
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  destination?: string;
  startDate?: string;       // ISO string
  endDate?: string;         // ISO string
  totalDays: number;
  isPublic: boolean;
  days: ItineraryDay[];
  stats: ItineraryStats;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────
// POST TYPES
// ─────────────────────────────────────────

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  media: MediaItem[];
  caption: string;
  location?: BoxLocation;
  boxes: ItineraryBox[];    // box allegati al post
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy — mantenuto per compatibilità
export interface ItineraryBox_Legacy {
  id: string;
  title: string;
  description: string;
  location: {
    name: string;
    coordinates?: { latitude: number; longitude: number };
  };
  duration: number;
  category: BoxCategory;
  tips?: string;
  estimatedCost?: number;
  tags?: string[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export interface Like {
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}
