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

export interface ItineraryBox {
  id: string;
  title: string;
  description: string;
  location: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  duration: number; // minuti
  category: 'food' | 'culture' | 'nature' | 'adventure' | 'relax' | 'nightlife' | 'shopping';
  tips?: string;
  estimatedCost?: number;
  tags?: string[];
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  media: MediaItem[];
  caption: string;
  location?: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  itineraryBoxes: ItineraryBox[];
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number; // per video, in secondi
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  description?: string;
  boxes: ItineraryBox[];
  totalDuration: number; // calcolato automaticamente
  coverImage?: string;
  isPublic: boolean;
  likesCount: number;
  savesCount: number;
  createdAt: Date;
  updatedAt: Date;
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