// components/skeleton-loader.tsx
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const POST_WIDTH = width - 24;
const POST_HEIGHT = POST_WIDTH * 1.1;

// Skeleton singolo elemento
function SkeletonBox({ width, height, borderRadius = 8, style }: any) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#e0e0e0',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton per Post Card
export function SkeletonPostCard() {
  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox width={36} height={36} borderRadius={18} />
        <View style={styles.headerText}>
          <SkeletonBox width={120} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <SkeletonBox width={80} height={10} borderRadius={4} />
        </View>
      </View>

      {/* Image */}
      <SkeletonBox width={POST_WIDTH} height={POST_HEIGHT} borderRadius={0} />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <SkeletonBox width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
          <SkeletonBox width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
          <SkeletonBox width={24} height={24} borderRadius={12} />
        </View>
        <SkeletonBox width={24} height={24} borderRadius={12} />
      </View>

      {/* Likes */}
      <View style={styles.content}>
        <SkeletonBox width={100} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        
        {/* Caption */}
        <SkeletonBox width="100%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
        <SkeletonBox width="80%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        
        {/* Timestamp */}
        <SkeletonBox width={60} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

// Skeleton per più post
export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPostCard key={index} />
      ))}
    </>
  );
}

// Skeleton per Stories
export function SkeletonStories() {
  return (
    <View style={styles.storiesContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.storyItem}>
          <SkeletonBox width={68} height={68} borderRadius={34} style={{ marginBottom: 6 }} />
          <SkeletonBox width={60} height={10} borderRadius={4} />
        </View>
      ))}
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  storiesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    marginBottom: 8,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
});