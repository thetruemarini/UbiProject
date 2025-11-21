// app/(tabs)/index.tsx - FINAL DESIGN

//TODO: Migliorare performance caricamento immagini (caching, lazy loading)
//TODO: Aggiungere animazioni al like (cuore che si ingrandisce)
//TODO: Implementare caricamento infinito (infinite scroll)

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
const POST_WIDTH = width - 24; // 12px margin per lato
const POST_HEIGHT = POST_WIDTH * 1.1; // Aspect ratio ottimizzato

const MOCK_STORIES: Story[] = [
  { id: '1', userId: '1', username: 'Colombo', destination: 'Bali', thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', viewed: false, userAvatar: '', createdAt: new Date() },
  { id: '2', userId: '2', username: 'Swiss Alps', destination: 'Swiss Alps', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7', viewed: false, createdAt: new Date() },
  { id: '3', userId: '3', username: 'Tokyo', destination: 'Tokyo', thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', viewed: false, createdAt: new Date() },
  { id: '4', userId: '4', username: 'Patagonia', destination: 'Patagonia', thumbnail: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31', viewed: false, createdAt: new Date() },
  { id: '5', userId: '5', username: 'Sahara', destination: 'Sahara', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35', viewed: false, createdAt: new Date() },
];

// Componente Gallery con Carousel interno
function PostGallery({ media, postId }: { media: Post['media']; postId: string }) {
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
        scrollEventThrottle={16}
        decelerationRate="fast">
        {media.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.95}
            onPress={() => router.push(`/post/${postId}`)}>
            <Image
              source={{ uri: item.url }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicatori dots - solo se più di 1 immagine */}
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
    
    if (seconds < 60) return 'now';
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
        contentContainerStyle={styles.feedContent}
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
              {/* Header del Post */}
              <View style={styles.postHeader}>
                <TouchableOpacity style={styles.userInfo}>
                  <Image 
                    source={{ 
                      uri: post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=FF6B35&color=fff&size=128`
                    }} 
                    style={styles.userAvatar} 
                  />
                  <View style={styles.userTextContainer}>
                    <Text style={styles.username}>{post.username}</Text>
                    {post.location && (
                      <Text style={styles.location} numberOfLines={1}>
                        {post.location.name}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <IconSymbol name="ellipsis" size={18} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Gallery Carousel */}
              <PostGallery media={post.media} postId={post.id} />

              {/* Actions */}
              <View style={styles.actionsRow}>
                <View style={styles.leftActions}>
                  <TouchableOpacity 
                    onPress={() => handleLike(post.id)} 
                    style={styles.actionButton}>
                    <IconSymbol 
                      name={isLiked ? "heart.fill" : "heart"} 
                      size={24} 
                      color={isLiked ? "#FF6B35" : "#262626"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/post/${post.id}`)}>
                    <IconSymbol name="message" size={22} color="#262626" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <IconSymbol name="paperplane" size={22} color="#262626" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="bookmark" size={22} color="#262626" />
                </TouchableOpacity>
              </View>

              {/* Likes */}
              {post.likesCount > 0 && (
                <TouchableOpacity style={styles.likesContainer}>
                  <Text style={styles.likesText}>
                    {post.likesCount > 1000 
                      ? `${(post.likesCount / 1000).toFixed(1)}K` 
                      : post.likesCount
                    } {post.likesCount === 1 ? 'like' : 'likes'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Caption */}
              <View style={styles.captionContainer}>
                <Text style={styles.caption} numberOfLines={2}>
                  <Text style={styles.captionUsername}>{post.username}</Text>
                  {' '}
                  <Text style={styles.captionText}>{post.caption}</Text>
                </Text>
              </View>

              {/* Comments Link */}
              {post.commentsCount > 0 && (
                <TouchableOpacity 
                  style={styles.commentsLink}
                  onPress={() => router.push(`/post/${post.id}`)}>
                  <Text style={styles.commentsLinkText}>
                    View all {post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}
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
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
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
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
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
    backgroundColor: '#f0f0f0',
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  location: {
    fontSize: 11,
    color: '#8e8e8e',
  },
  moreButton: {
    padding: 6,
  },
  galleryContainer: {
    position: 'relative',
    height: POST_HEIGHT,
    backgroundColor: '#f0f0f0',
  },
  galleryImage: {
    width: POST_WIDTH,
    height: POST_HEIGHT,
  },
  dotsContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 2,
  },
  likesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    color: '#262626',
  },
  captionUsername: {
    fontWeight: '600',
  },
  captionText: {
    fontWeight: '400',
  },
  commentsLink: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  commentsLinkText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  timestamp: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 12,
    fontSize: 10,
    color: '#8e8e8e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});