// app/(tabs)/index.tsx - OPTIMIZED VERSION
import { AnimatedPostCard } from '@/components/animated-post-card';
import { SkeletonFeed, SkeletonStories } from '@/components/skeleton-loader';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import PostService from '@/services/post.service';
import { Post, Story } from '@/types';
import { router } from 'expo-router';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const POSTS_PER_PAGE = 5;

const MOCK_STORIES: Story[] = [
  { id: '1', userId: '1', username: 'Bali', destination: 'Bali', thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', viewed: false, userAvatar: '', createdAt: new Date() },
  { id: '2', userId: '2', username: 'Swiss Alps', destination: 'Swiss Alps', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7', viewed: false, createdAt: new Date() },
  { id: '3', userId: '3', username: 'Tokyo', destination: 'Tokyo', thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', viewed: false, createdAt: new Date() },
  { id: '4', userId: '4', username: 'Patagonia', destination: 'Patagonia', thumbnail: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31', viewed: false, createdAt: new Date() },
  { id: '5', userId: '5', username: 'Sahara', destination: 'Sahara', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35', viewed: false, createdAt: new Date() },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Stati per infinite scroll
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot | undefined>(undefined);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      loadInitialFeed();
    }
  }, [user]);

  // Caricamento iniziale con batch likes
  const loadInitialFeed = async () => {
    if (!user) return;
    
    setLoading(true);
    setHasMore(true);
    lastDocRef.current = undefined;
    
    const result = await PostService.getFeed(undefined, POSTS_PER_PAGE);
    
    if (result.success && result.posts.length > 0) {
      setPosts(result.posts);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.posts.length === POSTS_PER_PAGE);
      
      // ✅ OTTIMIZZATO: Batch check likes
      const postIds = result.posts.map(post => post.id);
      const likesMap = await PostService.batchCheckLikes(postIds, user.id);
      
      const likedSet = new Set<string>();
      likesMap.forEach((isLiked, postId) => {
        if (isLiked) {
          likedSet.add(postId);
        }
      });
      setLikedPosts(likedSet);
    }
    
    setLoading(false);
  };

  // Carica più post (infinite scroll) con batch likes
  const loadMorePosts = async () => {
    if (!hasMore || isLoadingRef.current || !user) {
      return;
    }

    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const result = await PostService.getFeed(lastDocRef.current, POSTS_PER_PAGE);
      
      if (result.success && result.posts.length > 0) {
        setPosts(prevPosts => [...prevPosts, ...result.posts]);
        lastDocRef.current = result.lastDoc;
        
        // ✅ OTTIMIZZATO: Batch check likes
        const postIds = result.posts.map(post => post.id);
        const likesMap = await PostService.batchCheckLikes(postIds, user.id);
        
        const newLikedPosts = new Set(likedPosts);
        likesMap.forEach((isLiked, postId) => {
          if (isLiked) {
            newLikedPosts.add(postId);
          }
        });
        setLikedPosts(newLikedPosts);
        
        setHasMore(result.posts.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialFeed();
    setRefreshing(false);
  };

  // Handler per FlatList onEndReached
  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadMorePosts();
    }
  }, [loadingMore, hasMore]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);
    const newLikedPosts = new Set(likedPosts);
    
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 } 
        : p
    ));

    const result = await PostService.toggleLike(postId, user.id);
    
    if (!result.success) {
      if (isLiked) {
        newLikedPosts.add(postId);
      } else {
        newLikedPosts.delete(postId);
      }
      setLikedPosts(newLikedPosts);
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1 } 
          : p
      ));
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  // Footer component per loading indicator
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF6B35" />
        <Text style={styles.footerText}>Loading more posts...</Text>
      </View>
    );
  };

  // End message quando non ci sono più post
  const renderEndMessage = () => {
    if (loading || loadingMore || hasMore || posts.length === 0) return null;
    
    return (
      <View style={styles.endMessage}>
        <Text style={styles.endMessageIcon}>✨</Text>
        <Text style={styles.endMessageText}>You're all caught up!</Text>
        <Text style={styles.endMessageSubtext}>Check back later for more posts</Text>
      </View>
    );
  };

  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🌍</Text>
            </View>
            <Text style={styles.logo}>UBIVAIS</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="magnifyingglass" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="bell.fill" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView>
          <SkeletonStories />
          <SkeletonFeed count={3} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🌍</Text>
          </View>
          <Text style={styles.logo}>UBIVAIS</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/search')}>
            <IconSymbol name="magnifyingglass" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="bell.fill" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.storiesContainer}
            contentContainerStyle={styles.storiesContent}>
            {MOCK_STORIES.map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyItem}>
                <View style={[styles.storyRing, !story.viewed && styles.storyRingActive]}>
                  <Image source={{ uri: story.thumbnail }} style={styles.storyImage} />
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>
                  {story.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        }
        
        ListFooterComponent={
          <>
            {renderFooter()}
            {renderEndMessage()}
          </>
        }
        
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share your travel story!
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/create')}>
              <Text style={styles.createButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        }
        
        renderItem={({ item: post }) => {
          const isLiked = likedPosts.has(post.id);
          
          return (
            <AnimatedPostCard
              post={post}
              isLiked={isLiked}
              onLike={() => handleLike(post.id)}
              onDelete={() => {
                // Rimuovi post dalla lista
                setPosts(posts.filter(p => p.id !== post.id));
              }}
              onUpdate={() => {
                // Ricarica feed per vedere modifiche
                loadInitialFeed();
              }}
              formatTimeAgo={formatTimeAgo}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8e8e8e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 18,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#262626',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  feedContent: {
    paddingBottom: 20,
  },
  storiesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    marginBottom: 8,
  },
  storiesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  storyRingActive: {
    borderWidth: 2.5,
    borderColor: '#FF6B35',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
  },
  storyLabel: {
    fontSize: 11,
    color: '#262626',
    textAlign: 'center',
    maxWidth: 72,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8e8e8e',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  endMessageIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  endMessageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  endMessageSubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
  },
});