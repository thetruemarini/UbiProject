// app/post/[id].tsx - WITH KEYBOARD FIX
import { IconSymbol } from '@/components/ui/icon-symbol';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/auth-context';
import PostService from '@/services/post.service';
import { Post } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

// Gallery Component per il dettaglio post
function PostDetailGallery({ media }: { media: Post['media'] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.galleryContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {media.map((item, index) => (
          <Image
            key={index}
            source={{ uri: item.url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {media.length > 1 && (
        <View style={styles.dotsContainer}>
          {media.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
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
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

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
      Alert.alert('Error', 'Post not found');
      router.back();
    }
    
    setLoading(false);
  };

  const loadComments = () => {
    if (!id) return;

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

      await PostService.incrementCommentCount(post.id);
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
      
      setCommentText('');
      Keyboard.dismiss();
      
      // Scroll to bottom per mostrare il nuovo commento
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Failed to send comment');
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
            <IconSymbol name="chevron.right" size={28} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content - Scrollabile con dismissal tastiera */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image 
                source={{ 
                  uri: post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=FF6B35&color=fff&size=128`
                }} 
                style={styles.userAvatar} 
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{post.username}</Text>
                {post.location && (
                  <Text style={styles.location}>{post.location.name}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <IconSymbol name="ellipsis" size={20} color="#8e8e8e" />
              </TouchableOpacity>
            </View>

            {/* Post Gallery - Dimensioni Originali */}
            <PostDetailGallery media={post.media} />

            {/* Actions */}
            <View style={styles.actions}>
              <View style={styles.leftActions}>
                <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                  <IconSymbol 
                    name={isLiked ? "heart.fill" : "heart"} 
                    size={28} 
                    color={isLiked ? "#FF6B35" : "#262626"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => commentInputRef.current?.focus()}>
                  <IconSymbol name="message" size={26} color="#262626" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="paperplane" size={26} color="#262626" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <IconSymbol name="bookmark" size={26} color="#262626" />
              </TouchableOpacity>
            </View>

            {/* Likes */}
            {post.likesCount > 0 && (
              <Text style={styles.likes}>
                {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
              </Text>
            )}

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
                      source={{ 
                        uri: comment.userAvatar || `https://ui-avatars.com/api/?name=${comment.username}&background=FF6B35&color=fff&size=128`
                      }} 
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
              
              {/* Spazio extra per scrollare oltre l'ultimo commento */}
              <View style={{ height: 100 }} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Comment Input - Fisso in basso con keyboard avoidance */}
        <View style={styles.commentInputContainer}>
          <Image 
            source={{ 
              uri: user?.profilePic || `https://ui-avatars.com/api/?name=${user?.username}&background=FF6B35&color=fff&size=128`
            }} 
            style={styles.inputAvatar} 
          />
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#8e8e8e"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity 
            onPress={handleSendComment} 
            disabled={!commentText.trim() || sending}
            style={styles.sendButton}>
            <Text style={[
              styles.sendButtonText,
              (!commentText.trim() || sending) && styles.sendButtonDisabled
            ]}>
              {sending ? '...' : 'Post'}
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
    borderBottomColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  backButton: {
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
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
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
  },
  location: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 1,
  },
  moreButton: {
    padding: 4,
  },
  galleryContainer: {
    position: 'relative',
    backgroundColor: '#000',
  },
  postImage: {
    width: width,
    height: width * 1.25,
  },
  dotsContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    backgroundColor: '#FF6B35',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 14,
  },
  actionButton: {
    padding: 2,
  },
  likes: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  caption: {
    fontSize: 15,
    color: '#262626',
    lineHeight: 20,
    marginBottom: 6,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#8e8e8e',
    textTransform: 'uppercase',
  },
  commentsSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 16,
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
    color: '#262626',
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#8e8e8e',
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
    backgroundColor: '#f0f0f0',
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#262626',
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
    color: '#b0b0b0',
  },
});