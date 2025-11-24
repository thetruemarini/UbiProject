// services/post.service.ts - OPTIMIZED
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
  // Cache per likes per ridurre chiamate Firestore
  private likesCache = new Map<string, boolean>();

  // Crea nuovo post
  async createPost(
    userId: string,
    caption: string,
    mediaUrls: string[],
    itineraryBoxes: ItineraryBox[],
    location?: { name: string; coordinates?: { latitude: number; longitude: number } }
  ) {
    try {
      const postId = doc(this.postsCollection).id;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const username = userData?.username || 'Unknown';
      const userAvatar = userData?.profilePic || undefined;

      const newPost: Partial<Post> = {
        userId,
        username,
        userAvatar,
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

  // ✅ OTTIMIZZATO: Batch check likes per multipli post
  async batchCheckLikes(postIds: string[], userId: string): Promise<Map<string, boolean>> {
    try {
      const likesMap = new Map<string, boolean>();
      
      // Controlla prima la cache
      const uncachedPostIds = postIds.filter(postId => {
        const cacheKey = `${postId}_${userId}`;
        if (this.likesCache.has(cacheKey)) {
          likesMap.set(postId, this.likesCache.get(cacheKey)!);
          return false;
        }
        return true;
      });

      // Se tutti i post sono in cache, ritorna subito
      if (uncachedPostIds.length === 0) {
        return likesMap;
      }

      // Batch read da Firestore per post non in cache
      const likeChecks = await Promise.all(
        uncachedPostIds.map(async (postId) => {
          const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', userId));
          const isLiked = likeDoc.exists();
          
          // Salva in cache
          const cacheKey = `${postId}_${userId}`;
          this.likesCache.set(cacheKey, isLiked);
          
          return { postId, isLiked };
        })
      );

      // Aggiungi risultati alla mappa
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
        // Unlike
        batch.delete(likeRef);
        batch.update(doc(db, 'posts', postId), {
          likesCount: increment(-1),
        });
        
        // Aggiorna cache
        const cacheKey = `${postId}_${userId}`;
        this.likesCache.set(cacheKey, false);
        
        await batch.commit();
        return { success: true, liked: false };
      } else {
        // Like
        batch.set(likeRef, {
          userId,
          createdAt: Timestamp.now(),
        });
        batch.update(doc(db, 'posts', postId), {
          likesCount: increment(1),
        });
        
        // Aggiorna cache
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

  // Check se utente ha messo like (con cache)
  async hasLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const cacheKey = `${postId}_${userId}`;
      
      // Controlla cache
      if (this.likesCache.has(cacheKey)) {
        return this.likesCache.get(cacheKey)!;
      }

      // Se non in cache, controlla Firestore
      const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', userId));
      const isLiked = likeDoc.exists();
      
      // Salva in cache
      this.likesCache.set(cacheKey, isLiked);
      
      return isLiked;
    } catch (error) {
      console.error('Error checking like:', error);
      return false;
    }
  }

  // Clear cache (chiamare al logout)
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