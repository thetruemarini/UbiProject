// services/post.service.ts
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
} from 'firebase/firestore';

class PostService {
  private postsCollection = collection(db, 'posts');

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

      const newPost: any = {
        userId,
        media: mediaUrls.map((url) => ({
          type: url.includes('.mp4') ? 'video' : 'image',
          url,
        })),
        caption,
        itineraryBoxes,
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Aggiungi location solo se esiste
      if (location) {
        newPost.location = location;
      }

      await setDoc(doc(db, 'posts', postId), newPost);

      // Incrementa contatore post utente
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

  // Like/Unlike post
  async toggleLike(postId: string, userId: string) {
    try {
      const likeRef = doc(db, 'posts', postId, 'likes', userId);
      const likeDoc = await getDoc(likeRef);

      if (likeDoc.exists()) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(doc(db, 'posts', postId), {
          likesCount: increment(-1),
        });
        return { success: true, liked: false };
      } else {
        // Like
        await setDoc(likeRef, {
          userId,
          createdAt: Timestamp.now(),
        });
        await updateDoc(doc(db, 'posts', postId), {
          likesCount: increment(1),
        });
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
      const likeDoc = await getDoc(doc(db, 'posts', postId, 'likes', userId));
      return likeDoc.exists();
    } catch (error) {
      console.error('Error checking like:', error);
      return false;
    }
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

      // Decrementa contatore
      await updateDoc(doc(db, 'users', userId), {
        postsCount: increment(-1),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PostService();