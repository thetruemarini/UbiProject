// app/post/[id].tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/auth-context';
import PostService from '@/services/post.service';
import { Post } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    if (!id || !user) return;

    setLoading(true);
    const postData = await PostService.getPost(id);
    
    if (postData) {
      setPost(postData);
      const liked = await PostService.hasLiked(id, user.id);
      setIsLiked(liked);
    } else {
      Alert.alert('Errore', 'Post non trovato');
      router.back();
    }
    
    setLoading(false);
  };

  const loadComments = () => {
    if (!id) return;

    // Real-time listener per commenti
    const commentsRef = collection(db, 'posts', id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments: Comment[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          username: data.username,
          userAvatar: data.userAvatar,
          text: data.text,
          createdAt: data.createdAt.toDate(),
        };
      });
      setComments(loadedComments);
    });

    return () => unsubscribe();
  };

  const handleLike = async () => {
    if (!post || !user) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    const newCount = newLikedState ? post.likesCount + 1 : post.likesCount - 1;
    setPost({ ...post, likesCount: newCount });

    const result = await PostService.toggleLike(post.id, user.id);
    
    if (!result.success) {
      setIsLiked(!newLikedState);
      setPost({ ...post, likesCount: post.likesCount });
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user || !post) return;

    setSending(true);

    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      
      await addDoc(commentsRef, {
        userId: user.id,
        username: user.username,
        userAvatar: user.profilePic || null,
        text: commentText.trim(),
        createdAt: Timestamp.now(),
      });

      // Update comment count
      await PostService.incrementCommentCount(post.id);
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
      
      setCommentText('');
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Errore', 'Impossibile inviare il commento');
    } finally {
      setSending(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.right" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <Image 
              source={{ uri: post.userAvatar || 'https://i.pravatar.cc/150' }} 
              style={styles.userAvatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{post.username}</Text>
              {post.location && (
                <Text style={styles.location}>{post.location.name}</Text>
              )}
            </View>
          </View>

          {/* Post Image */}
          <Image source={{ uri: post.media[0].url }} style={styles.postImage} />

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <IconSymbol 
                  name={isLiked ? "heart.fill" : "heart"} 
                  size={28} 
                  color={isLiked ? "#FF6B35" : "#000"} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="message" size={26} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol name="paperplane" size={26} color="#000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity>
              <IconSymbol name="bookmark" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Likes */}
          <Text style={styles.likes}>
            {post.likesCount > 0 ? `${post.likesCount.toLocaleString()} likes` : 'Be the first to like this'}
          </Text>

          {/* Caption */}
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{post.username}</Text> {post.caption}
            </Text>
            <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({post.commentsCount})
            </Text>

            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsIcon}>💬</Text>
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <Image 
                    source={{ uri: comment.userAvatar || 'https://i.pravatar.cc/150' }} 
                    style={styles.commentAvatar} 
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentUsername}>{comment.username}</Text> {comment.text}
                    </Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <Image 
            source={{ uri: user?.profilePic || 'https://i.pravatar.cc/150' }} 
            style={styles.inputAvatar} 
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={handleSendComment} 
            disabled={!commentText.trim() || sending}
            style={styles.sendButton}>
            <Text style={[
              styles.sendButtonText,
              (!commentText.trim() || sending) && styles.sendButtonDisabled
            ]}>
              {sending ? 'Sending...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  location: {
    fontSize: 13,
    color: '#666',
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 2,
  },
  likes: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  caption: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  commentsSection: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
  sendButtonDisabled: {
    color: '#ccc',
  },
});