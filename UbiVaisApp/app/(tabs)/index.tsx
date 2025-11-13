// app/(tabs)/index.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import PostService from '@/services/post.service';
import { Post, Story } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
  { id: '1', userId: '1', username: 'You', destination: 'Bali', thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', viewed: false, userAvatar: '', createdAt: new Date() },
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
        <Text style={styles.logo}>UBIVAIS</Text>
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
                  {story.destination}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>Nessun post nel feed</Text>
            <Text style={styles.emptyText}>
              Non ci sono ancora post. Crea il primo!
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(tabs)/create')}>
              <Text style={styles.createButtonText}>Crea Post</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: post }) => {
          const isLiked = likedPosts.has(post.id);
          
          return (
            <View style={styles.postContainer}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.postUserInfo}>
                  <Image 
                    source={{ uri: post.userAvatar || `https://i.pravatar.cc/150?u=${post.userId}` }} 
                    style={styles.userAvatar} 
                  />
                  <View style={styles.userTextInfo}>
                    <Text style={styles.username}>{post.username}</Text>
                    <View style={styles.metaRow}>
                      {post.location && (
                        <>
                          <Text style={styles.location}>{post.location.name}</Text>
                          <Text style={styles.dotSeparator}> • </Text>
                        </>
                      )}
                      <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="ellipsis" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Caption */}
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => router.push(`/post/${post.id}`)}>
                <Text style={styles.caption} numberOfLines={3}>
                  {post.caption}
                </Text>
              </TouchableOpacity>

              {/* Post Image */}
              <TouchableOpacity 
                activeOpacity={0.95}
                onPress={() => router.push(`/post/${post.id}`)}>
                <Image source={{ uri: post.media[0].url }} style={styles.postImage} />
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <View style={styles.leftActions}>
                  <TouchableOpacity 
                    onPress={() => handleLike(post.id)} 
                    style={styles.actionButton}>
                    <IconSymbol 
                      name={isLiked ? "heart.fill" : "heart"} 
                      size={22} 
                      color={isLiked ? "#FF6B35" : "#000"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/post/${post.id}`)}>
                    <IconSymbol name="message" size={21} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <IconSymbol name="paperplane" size={21} color="#000" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="bookmark" size={21} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  {post.likesCount > 0 && (
                    <Text style={styles.statsBold}>{post.likesCount} likes</Text>
                  )}
                  {post.likesCount > 0 && post.commentsCount > 0 && ' • '}
                  {post.commentsCount > 0 && (
                    <Text style={styles.statsGray}>{post.commentsCount} comments</Text>
                  )}
                </Text>
              </View>
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 1,
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
  },
  storiesContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    marginBottom: 6,
  },
  storyRingActive: {
    borderWidth: 2.5,
    borderColor: '#FF6B35',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyLabel: {
    fontSize: 11,
    color: '#000',
    textAlign: 'center',
    maxWidth: 70,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#666',
  },
  dotSeparator: {
    fontSize: 13,
    color: '#999',
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  caption: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  postImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  statsRow: {
    paddingHorizontal: 16,
  },
  statsText: {
    fontSize: 13,
    color: '#666',
  },
  statsBold: {
    fontWeight: '600',
    color: '#000',
  },
  statsGray: {
    color: '#666',
  },
});