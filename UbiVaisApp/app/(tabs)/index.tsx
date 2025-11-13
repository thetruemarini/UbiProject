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

// Mock stories - poi sostituiremo anche queste
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
    
    console.log('📡 Caricamento feed da Firebase...');
    setLoading(true);
    const result = await PostService.getFeed();
    
    console.log('📊 Risultato:', result);
    
    if (result.success) {
      console.log('✅ Post caricati:', result.posts.length);
      setPosts(result.posts);
      
      // Carica i like dell'utente
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
    } else {
      console.log('❌ Errore caricamento feed');
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
    
    // Ottimistic update
    const newLikedPosts = new Set(likedPosts);
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    // Update UI immediatamente
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 } 
        : p
    ));

    // Update su Firebase
    const result = await PostService.toggleLike(postId, user.id);
    
    if (!result.success) {
      // Rollback in caso di errore
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
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  if (!user) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Caricamento feed...</Text>
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
          <>
            {/* Stories */}
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
          </>
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
            <View style={styles.postCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.postUser}>
                  <Image 
                    source={{ uri: post.userAvatar || 'https://i.pravatar.cc/150' }} 
                    style={styles.userAvatar} 
                  />
                  <View>
                    <Text style={styles.username}>{post.username}</Text>
                    {post.location && (
                      <Text style={styles.location}>{post.location.name}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="ellipsis" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Post Image */}
              <Image source={{ uri: post.media[0].url }} style={styles.postImage} />

              {/* Post Actions */}
              <View style={styles.postActions}>
                <View style={styles.leftActions}>
                  <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.actionButton}>
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

              {/* Post Info */}
              <View style={styles.postInfo}>
                <Text style={styles.likes}>
                  Liked by {post.likesCount > 0 ? post.likesCount.toLocaleString() : '0'} {post.likesCount === 1 ? 'person' : 'others'}
                </Text>
                <Text style={styles.caption}>
                  <Text style={styles.captionUsername}>{post.username}</Text> {post.caption}
                </Text>
                {post.commentsCount > 0 && (
                  <TouchableOpacity>
                    <Text style={styles.viewComments}>
                      View all {post.commentsCount} comments
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
  },
  postActions: {
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
  postInfo: {
    paddingHorizontal: 12,
    gap: 4,
  },
  likes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
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
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});