// app/(tabs)/profile.tsx
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/auth-context';
import StorageService from '@/services/cloudinary.service';
import PostService from '@/services/post.service';
import { Post } from '@/types';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'itineraries' | 'saved' | 'badges'>('itineraries');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserPosts();
      setEditDisplayName(user.displayName);
      setEditUsername(user.username);
      setEditBio(user.bio || '');
    }
  }, [user]);

  const loadUserPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await PostService.getUserPosts(user.id);
    
    if (result.success) {
      setUserPosts(result.posts);
    }
    setLoading(false);
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.displayName}'s profile on UbiVais! @${user?.username}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSettings = () => {
    Alert.alert('Impostazioni', 'Funzionalità in arrivo!');
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!editDisplayName.trim() || !editUsername.trim()) {
      Alert.alert('Errore', 'Nome e username sono obbligatori');
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, 'users', user.id), {
        displayName: editDisplayName.trim(),
        username: editUsername.toLowerCase().trim(),
        bio: editBio.trim(),
      });

      Alert.alert('Successo', 'Profilo aggiornato!', [
        { text: 'OK', onPress: () => setEditModalVisible(false) }
      ]);
      
      await loadUserPosts();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il profilo');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadProfilePic = async () => {
    if (!user) return;

    const result = await StorageService.pickMedia(false, 'images');
    
    if (!result.success || !result.assets) return;

    setUploadingPhoto(true);

    try {
      const uploadResult = await StorageService.uploadProfilePicture(
        result.assets[0].uri,
        user.id
      );

      if (!uploadResult.success) {
        Alert.alert('Errore', 'Impossibile caricare la foto');
        return;
      }

      await updateDoc(doc(db, 'users', user.id), {
        profilePic: uploadResult.url,
      });

      Alert.alert('Successo', 'Foto profilo aggiornata!');
    } catch (error) {
      console.error('Error uploading profile pic:', error);
      Alert.alert('Errore', 'Impossibile aggiornare la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>{user.username}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleSettings} style={styles.headerIcon}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEditProfile} style={styles.headerIcon}>
            <Text style={styles.iconText}>✎</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleUploadProfilePic}
            disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name & Bio */}
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.bio}>
            {user.bio || 'Passionate globetrotter sharing curated itineraries & hidden gems. Let\'s explore!'}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followersCount > 1000 ? `${(user.followersCount / 1000).toFixed(1)}K` : user.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
              <Text style={styles.shareButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Travel Map Placeholder */}
        <View style={styles.mapContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800' }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          <View style={styles.mapOverlay}>
            <Text style={styles.mapText}>🗺️ Travel Map</Text>
            <Text style={styles.mapSubtext}>Coming Soon</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'itineraries' && styles.tabActive]}
            onPress={() => setActiveTab('itineraries')}>
            <Text style={[styles.tabText, activeTab === 'itineraries' && styles.tabTextActive]}>
              Itineraries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}>
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
            onPress={() => setActiveTab('badges')}>
            <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>
              Badges
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : activeTab === 'itineraries' ? (
          userPosts.length > 0 ? (
            <View style={styles.itinerariesGrid}>
              {userPosts.map((post) => (
                <TouchableOpacity key={post.id} style={styles.itineraryCard}>
                  <Image 
                    source={{ uri: post.media[0].url }} 
                    style={styles.itineraryImage} 
                  />
                  <View style={styles.itineraryOverlay}>
                    <View style={styles.itineraryIcon}>
                      <Text style={styles.itineraryIconText}>✈️</Text>
                    </View>
                    <Text style={styles.itineraryTitle} numberOfLines={1}>
                      {post.location?.name || 'Travel'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyTitle}>No itineraries yet</Text>
              <Text style={styles.emptyText}>
                Start creating your travel itineraries!
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/create')}>
                <Text style={styles.createButtonText}>Create Post</Text>
              </TouchableOpacity>
            </View>
          )
        ) : activeTab === 'saved' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No saved posts</Text>
            <Text style={styles.emptyText}>
              Posts you save will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No badges yet</Text>
            <Text style={styles.emptyText}>
              Earn badges by exploring new places!
            </Text>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Logout', 
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/(auth)/login');
                }
              }
            ]);
          }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                placeholder="Your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="username"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>{editBio.length}/150</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerLeft: {
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  editButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  itinerariesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  itineraryCard: {
    width: (width - 48) / 2,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  itineraryImage: {
    width: '100%',
    height: '100%',
  },
  itineraryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    justifyContent: 'space-between',
  },
  itineraryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itineraryIconText: {
    fontSize: 20,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
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
  logoutButton: {
    margin: 16,
    padding: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#000',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  modalSaveDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
});