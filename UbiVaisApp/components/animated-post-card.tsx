// components/animated-post-card.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Post } from '@/types';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const POST_WIDTH = width - 24;
const POST_HEIGHT = POST_WIDTH * 1.1;

interface AnimatedPostCardProps {
  post: Post;
  isLiked: boolean;
  onLike: () => void;
  formatTimeAgo: (date: Date) => string;
}

// Gallery Component - ONE TAP per aprire post
function AnimatedPostGallery({ 
  media, 
  postId
}: { 
  media: Post['media']; 
  postId: string;
}) {
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
            activeOpacity={0.98}
            onPress={() => router.push(`/post/${postId}`)}>
            <Image
              source={{ uri: item.url }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots indicator */}
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

// Animated Like Button
function AnimatedLikeButton({ 
  isLiked, 
  onPress 
}: { 
  isLiked: boolean; 
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // Haptic feedback su iOS
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animazione pulsazione
    scale.value = withSpring(0.8, {
      damping: 8,
      stiffness: 200,
    }, () => {
      scale.value = withSpring(1, {
        damping: 8,
        stiffness: 200,
      });
    });

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity onPress={handlePress} style={styles.actionButton}>
      <Animated.View style={animatedStyle}>
        <IconSymbol 
          name={isLiked ? "heart.fill" : "heart"} 
          size={24} 
          color={isLiked ? "#FF6B35" : "#262626"} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// Main Post Card Component
export function AnimatedPostCard({ 
  post, 
  isLiked, 
  onLike, 
  formatTimeAgo 
}: AnimatedPostCardProps) {
  // Animazione fade-in del post
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
    });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.postCard, animatedCardStyle]}>
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

      {/* Gallery Carousel - ONE TAP per aprire */}
      <AnimatedPostGallery 
        media={post.media} 
        postId={post.id}
      />

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <AnimatedLikeButton isLiked={isLiked} onPress={onLike} />
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  centerHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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