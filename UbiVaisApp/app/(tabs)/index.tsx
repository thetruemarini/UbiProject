// app/(tabs)/index.tsx - REDESIGNED
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import PostService from '@/services/post.service';
import { Post, Story } from '@/types';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

const MOCK_STORIES: Story[] = [
  { id: '1', userId: '1', username: 'Bali', destination: 'Bali', thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', viewed: false, userAvatar: '', createdAt: new Date() },
  { id: '2', userId: '2', username: 'Swiss Alps', destination: 'Swiss Alps', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7', viewed: false, createdAt: new Date() },
  { id: '3', userId: '3', username: 'Tokyo', destination: 'Tokyo', thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', viewed: false, createdAt: new Date() },
  { id: '4', userId: '4', username: 'Patagonia', destination: 'Patagonia', thumbnail: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31', viewed: false, createdAt: new Date() },
  { id: '5', userId: '5', username: 'Sahara', destination: 'Sahara', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35', viewed: false, createdAt: new Date() },
];

// Componente per Gallery di immagini con swipe
function PostGallery({ media }: { media: Post['media'] }) {
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

      {/* Indicatori dots */}
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

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await PostService.getFeed();
    
    if (result.success) {
      setPosts(result.posts);
      
      const likeChecks = await Promise.all(
        result.posts.map(post => PostService.hasLiked(post.id, user.id))
      );
      const likedSet = new Set<string>();
      result.posts.forEach((post, index) => {
        if (likeChecks[index]) {
          likedSet.add(post.id);
        }
      });
      setLikedPosts(likedSet);
    }
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

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
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  if (!user) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
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
            <View style={styles.postCard}>
              {/* Post Header - Avatar + Username + Location */}
              <View style={styles.postHeader}>
                <TouchableOpacity style={styles.userInfo}>
                  <Image 
                    source={{ uri: post.userAvatar || `https://i.pravatar.cc/150?u=${post.userId}` }} 
                    style={styles.userAvatar} 
                  />
                  <View style={styles.userTextContainer}>
                    <Text style={styles.username}>{post.username}</Text>
                    {post.location && (
                      <Text style={styles.location}>{post.location.name}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <IconSymbol name="ellipsis" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Post Gallery */}
              <TouchableOpacity 
                activeOpacity={0.95}
                onPress={() => router.push(`/post/${post.id}`)}>
                <PostGallery media={post.media} />
              </TouchableOpacity>

              {/* Actions Row */}
              <View style={styles.actionsRow}>
                <View style={styles.leftActions}>
                  <TouchableOpacity 
                    onPress={() => handleLike(post.id)} 
                    style={styles.actionButton}>
                    <IconSymbol 
                      name={isLiked ? "heart.fill" : "heart"} 
                      size={26} 
                      color={isLiked ? "#FF6B35" : "#000"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/post/${post.id}`)}>
                    <IconSymbol name="message" size={24} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <IconSymbol name="paperplane" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="bookmark" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Likes Count */}
              {post.likesCount > 0 && (
                <Text style={styles.likesText}>
                  Liked by <Text style={styles.likesCount}>
                    {post.likesCount > 1000 
                      ? `${(post.likesCount / 1000).toFixed(1)}K` 
                      : post.likesCount
                    } others
                  </Text>
                </Text>
              )}

              {/* Caption */}
              <View style={styles.captionContainer}>
                <Text style={styles.caption} numberOfLines={3}>
                  <Text style={styles.captionUsername}>{post.username}</Text>
                  {' '}
                  {post.caption}
                </Text>
              </View>

              {/* View Comments */}
              {post.commentsCount > 0 && (
                <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
                  <Text style={styles.viewComments}>
                    View all {post.commentsCount} comments
                  </Text>
                </TouchableOpacity>
              )}

              {/* Timestamp */}
              <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
            </View>
          );
        }}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
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
    color: '#000',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  storiesContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  storiesContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 14,
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
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  storyLabel: {
    fontSize: 11,
    color: '#000',
    textAlign: 'center',
    maxWidth: 72,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
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
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 1,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  galleryContainer: {
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    width: width,
    height: width * 1.25,
    backgroundColor: '#f0f0f0',
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FF6B35',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 14,
  },
  actionButton: {
    padding: 2,
  },
  likesText: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
    marginBottom: 6,
  },
  likesCount: {
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#737373',
    marginBottom: 4,
  },
  timestamp: {
    paddingHorizontal: 12,
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});