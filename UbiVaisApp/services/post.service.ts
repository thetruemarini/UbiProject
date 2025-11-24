// services/post.service.ts - OPTIMIZED WITH IMAGE COMPRESSION
import { db } from '@/config/firebase';
import { ItineraryBox, Post } from '@/types';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

class PostService {
  private postsCollection = collection(db, 'posts');
  private likesCache = new Map<string, boolean>();

  // ✅ NUOVO: Helper per ottimizzare URL immagini (Cloudinary)
  optimizeImageUrl(url: string, width: number = 800, quality: number = 80): string {
    // Se è Cloudinary, aggiungi trasformazioni
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},q_${quality},f_auto/${parts[1]}`;
      }
    }
    return url;
  }

  // Crea nuovo post con userAvatar
  async createPost(
    userId: string,
    caption: string,
    mediaUrls: string[],
    itineraryBoxes: ItineraryBox[],
    location?: { name: string; coordinates?: { latitude: number; longitude: number } }
  ) {
    try {
      const postId = doc(this.postsCollection).id;

      // ✅ Carica dati utente completi
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const username = userData?.username || 'Unknown';
      const userAvatar = userData?.profilePic || undefined;

      const newPost: Partial<Post> = {
        userId,
        username,
        userAvatar, // ✅ Salva avatar utente
        media: mediaUrls.map((url) => ({
          type: url.includes('.mp4') ? 'video' : 'image',
          url,
        })),
        caption,
        itineraryBoxes,
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (location && location.name) {
        newPost.location = location;
      }

      const postData = {
        ...newPost,
        createdAt: Timestamp.fromDate(newPost.createdAt as Date),
        updatedAt: Timestamp.fromDate(newPost.updatedAt as Date),
      };

      await setDoc(doc(db, 'posts', postId), postData);

      await updateDoc(doc(db, 'users', userId), {
        postsCount: increment(1),
      });

      return { success: true, postId };
    } catch (error: any) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  }

  // Get post singolo
  async getPost(postId: string): Promise<Post | null> {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const data = postDoc.data();
        return {
          id: postDoc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Post;
      }
      return null;
    } catch (error) {
      console.error('Error getting post:', error);
      return null;
    }
  }

  // Get feed (posts recenti)
  async getFeed(lastDoc?: QueryDocumentSnapshot, limitCount: number = 10) {
    try {
      let q = query(
        this.postsCollection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const posts: Post[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Post;
      });

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      return { success: true, posts, lastDoc: lastVisible };
    } catch (error: any) {
      console.error('Error getting feed:', error);
      return { success: false, error: error.message, posts: [] };
    }
  }

  // Get posts di un utente
  async getUserPosts(userId: string) {
    try {
      const q = query(
        this.postsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const posts: Post[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Post;
      });

      return { success: true, posts };
    } catch (error: any) {
      console.error('Error getting user posts:', error);
      return { success: false, error: error.message, posts: [] };
    }
  }

  // Batch check likes per multipli post
  async batchCheckLikes(postIds: string[], userId: string): Promise<Map<string, boolean>> {
    try {
      const likesMap = new Map<string, boolean>();
      
      const uncachedPostIds = postIds.filter(postId => {
        const cacheKey = `${postId}_${userId}`;
        if (this.likesCache.has(cacheKey)) {
          likesMap.set(postId, this.likesCache.get(cacheKey)!);
          return false;
        }
        return true;
      });

      if (uncachedPostIds.length === 0) {
        return likesMap;
      }

      const likeChecks = await Promise.all(
        uncachedPostIds.map(async (postId) => {
          const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', userId));
          const isLiked = likeDoc.exists();
          
          const cacheKey = `${postId}_${userId}`;
          this.likesCache.set(cacheKey, isLiked);
          
          return { postId, isLiked };
        })
      );

      likeChecks.forEach(({ postId, isLiked }) => {
        likesMap.set(postId, isLiked);
      });

      return likesMap;
    } catch (error) {
      console.error('Error batch checking likes:', error);
      return new Map();
    }
  }

  // Like/Unlike post
  async toggleLike(postId: string, userId: string) {
    try {
      const likeRef = doc(db, 'posts', postId, 'likes', userId);
      const likeDoc = await getDoc(likeRef);

      const batch = writeBatch(db);

      if (likeDoc.exists()) {
        batch.delete(likeRef);
        batch.update(doc(db, 'posts', postId), {
          likesCount: increment(-1),
        });
        
        const cacheKey = `${postId}_${userId}`;
        this.likesCache.set(cacheKey, false);
        
        await batch.commit();
        return { success: true, liked: false };
      } else {
        batch.set(likeRef, {
          userId,
          createdAt: Timestamp.now(),
        });
        batch.update(doc(db, 'posts', postId), {
          likesCount: increment(1),
        });
        
        const cacheKey = `${postId}_${userId}`;
        this.likesCache.set(cacheKey, true);
        
        await batch.commit();
        return { success: true, liked: true };
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      return { success: false, error: error.message };
    }
  }

  // Check se utente ha messo like
  async hasLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const cacheKey = `${postId}_${userId}`;
      
      if (this.likesCache.has(cacheKey)) {
        return this.likesCache.get(cacheKey)!;
      }

      const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', userId));
      const isLiked = likeDoc.exists();
      
      this.likesCache.set(cacheKey, isLiked);
      
      return isLiked;
    } catch (error) {
      console.error('Error checking like:', error);
      return false;
    }
  }

  // ✅ NUOVO: Aggiorna post
  async updatePost(postId: string, userId: string, caption: string, location?: { name: string }) {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      
      if (!postDoc.exists()) {
        return { success: false, error: 'Post non trovato' };
      }

      const post = postDoc.data();
      if (post.userId !== userId) {
        return { success: false, error: 'Non autorizzato' };
      }

      const updateData: any = {
        caption,
        updatedAt: Timestamp.now(),
      };

      if (location && location.name) {
        updateData.location = location;
      }

      await updateDoc(doc(db, 'posts', postId), updateData);

      return { success: true };
    } catch (error: any) {
      console.error('Error updating post:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cache
  clearCache() {
    this.likesCache.clear();
  }

  // Elimina post
  async deletePost(postId: string, userId: string) {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        return { success: false, error: 'Post non trovato' };
      }

      const post = postDoc.data();
      if (post.userId !== userId) {
        return { success: false, error: 'Non autorizzato' };
      }

      await deleteDoc(doc(db, 'posts', postId));

      await updateDoc(doc(db, 'users', userId), {
        postsCount: increment(-1),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      return { success: false, error: error.message };
    }
  }

  async incrementCommentCount(postId: string) {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error incrementing comment count:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PostService();