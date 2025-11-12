// app/(tabs)/index.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { Post, Story } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

// Mock data - poi sostituiremo con dati reali da Firebase
const MOCK_STORIES: Story[] = [
  { id: '1', userId: '1', username: 'You', destination: 'Bali', thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', viewed: false, userAvatar: '', createdAt: new Date() },
  { id: '2', userId: '2', username: 'Swiss Alps', destination: 'Swiss Alps', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7', viewed: false, createdAt: new Date() },
  { id: '3', userId: '3', username: 'Tokyo', destination: 'Tokyo', thumbnail: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', viewed: false, createdAt: new Date() },
  { id: '4', userId: '4', username: 'Patagonia', destination: 'Patagonia', thumbnail: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31', viewed: false, createdAt: new Date() },
  { id: '5', userId: '5', username: 'Sahara', destination: 'Sahara', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35', viewed: false, createdAt: new Date() },
];

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    userId: '1',
    username: 'Wanderlust_Explorer',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19' }],
    caption: 'Sunset hues over Oia. Can\'t believe this is real! #TravelGreece #IslandLife #SunsetChaser',
    location: { name: 'Santorini, Greece' },
    itineraryBoxes: [],
    likesCount: 1234,
    commentsCount: 35,
    savesCount: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: '2',
    username: 'MountainMan_Dan',
    userAvatar: 'https://i.pravatar.cc/150?img=12',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4' }],
    caption: 'Moraine Lake never disappoints 🏔️ #BanffNationalPark #CanadianRockies',
    location: { name: 'Banff, Canada' },
    itineraryBoxes: [],
    likesCount: 2156,
    commentsCount: 67,
    savesCount: 145,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Qui caricheremo i post da Firebase
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
    ));
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>UBIVAIS</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
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
        renderItem={({ item: post }) => (
          <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.postUser}>
                <Image source={{ uri: post.userAvatar }} style={styles.userAvatar} />
                <View>
                  <Text style={styles.username}>{post.username}</Text>
                  <Text style={styles.location}>{post.location?.name}</Text>
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
                  <IconSymbol name="heart" size={28} color="#000" />
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
              <Text style={styles.likes}>Liked by {post.likesCount.toLocaleString()} others</Text>
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
              <Text style={styles.timestamp}>4 hours ago</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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