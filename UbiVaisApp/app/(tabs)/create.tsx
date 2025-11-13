// app/(tabs)/create.tsx
import { useAuth } from '@/contexts/auth-context';
import StorageService from '@/services/cloudinary.service';
import PostService from '@/services/post.service';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CreateScreen() {
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickMedia = async () => {
    const result = await StorageService.pickMedia(true, 'images');
    
    if (result.success && result.assets) {
      setSelectedMedia(result.assets);
    } else if (result.error && result.error !== 'Selezione annullata') {
      Alert.alert('Errore', result.error);
    }
  };

  const handleCreatePost = async () => {
    if (!user) return;

    if (selectedMedia.length === 0) {
      Alert.alert('Attenzione', 'Seleziona almeno una foto');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Attenzione', 'Scrivi una descrizione per il tuo post');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload immagini su Firebase Storage
      console.log('📤 Upload immagini...');
      const uris = selectedMedia.map(media => media.uri);
      const uploadResult = await StorageService.uploadMultipleFiles(uris, user.id);

      if (!uploadResult.success) {
        Alert.alert('Errore Upload', uploadResult.error || 'Impossibile caricare le immagini');
        setUploading(false);
        return;
      }

      console.log('✅ Immagini caricate:', uploadResult.urls);

      // 2. Crea post su Firestore
      console.log('💾 Creazione post...');
      const postResult = await PostService.createPost(
        user.id,
        caption.trim(),
        uploadResult.urls!,
        [], // itineraryBoxes vuoto per ora
        location.trim() ? { name: location.trim() } : undefined
      );

      if (!postResult.success) {
        Alert.alert('Errore', postResult.error || 'Impossibile creare il post');
        setUploading(false);
        return;
      }

      console.log('✅ Post creato con ID:', postResult.postId);

      // 3. Reset form e torna al feed
      Alert.alert(
        'Post pubblicato! 🎉',
        'Il tuo post è stato pubblicato con successo',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedMedia([]);
              setCaption('');
              setLocation('');
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Errore creazione post:', error);
      Alert.alert('Errore', 'Si è verificato un errore imprevisto');
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Annulla</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nuovo Post</Text>
          <TouchableOpacity
            onPress={handleCreatePost}
            disabled={uploading || selectedMedia.length === 0 || !caption.trim()}>
            <Text
              style={[
                styles.publishButton,
                (uploading || selectedMedia.length === 0 || !caption.trim()) &&
                  styles.publishButtonDisabled,
              ]}>
              {uploading ? 'Caricamento...' : 'Pubblica'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Media Selection */}
          {selectedMedia.length > 0 ? (
            <View style={styles.mediaPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedMedia.map((media, index) => (
                  <View key={index} style={styles.mediaContainer}>
                    <Image source={{ uri: media.uri }} style={styles.mediaThumbnail} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMedia(index)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addMoreButton} onPress={handlePickMedia}>
                  <Text style={styles.addMoreIcon}>+</Text>
                  <Text style={styles.addMoreText}>Aggiungi</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handlePickMedia}
              disabled={uploading}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Seleziona foto</Text>
              <Text style={styles.uploadSubtext}>Puoi selezionarne più di una</Text>
            </TouchableOpacity>
          )}

          {/* Caption Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Descrizione *</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Scrivi una descrizione del tuo viaggio..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2200}
              editable={!uploading}
            />
            <Text style={styles.charCount}>{caption.length}/2200</Text>
          </View>

          {/* Location Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📍 Località (opzionale)</Text>
            <TextInput
              style={styles.input}
              placeholder="Es: Santorini, Greece"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
              editable={!uploading}
            />
          </View>

          {/* Coming Soon Section */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonTitle}>🚀 Prossimamente</Text>
            <Text style={styles.comingSoonText}>
              • Box attività per creare itinerari{'\n'}
              • Selezione location con mappa{'\n'}
              • Tag di altri utenti{'\n'}
              • Hashtag suggeriti
            </Text>
          </View>

          {/* Upload Indicator */}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.uploadingText}>Pubblicazione in corso...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
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
  cancelButton: {
    fontSize: 16,
    color: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  publishButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  publishButtonDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
  },
  uploadArea: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    padding: 60,
    alignItems: 'center',
    margin: 16,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  mediaPreview: {
    padding: 16,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mediaThumbnail: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addMoreButton: {
    width: 120,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreIcon: {
    fontSize: 32,
    color: '#999',
    marginBottom: 8,
  },
  addMoreText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  comingSoonSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0e7ff',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  uploadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
}); 