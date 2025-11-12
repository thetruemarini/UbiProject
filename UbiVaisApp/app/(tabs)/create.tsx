// app/(tabs)/create.tsx
import { useAuth } from '@/contexts/auth-context';
import StorageService from '@/services/storage.service';
import { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateScreen() {
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handlePickMedia = async () => {
    const result = await StorageService.pickMedia(true, 'all');
    
    if (result.success && result.assets) {
      setSelectedMedia(result.assets);
    } else if (result.error) {
      Alert.alert('Errore', result.error);
    }
  };

  const handleCreatePost = () => {
    if (selectedMedia.length === 0) {
      Alert.alert('Attenzione', 'Seleziona almeno una foto o video');
      return;
    }

    Alert.alert(
      'Prossimamente! 🚀',
      'Qui potrai creare il tuo post con foto, descrizione e box attività'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crea Nuovo Post</Text>
        <Text style={styles.subtitle}>Condividi il tuo viaggio 🌍</Text>
      </View>

      <ScrollView style={styles.content}>
        {selectedMedia.length > 0 ? (
          <View style={styles.mediaPreview}>
            <Text style={styles.sectionTitle}>
              Media selezionati ({selectedMedia.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMedia.map((media, index) => (
                <Image
                  key={index}
                  source={{ uri: media.uri }}
                  style={styles.mediaThumbnail}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickMedia}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>Tocca per selezionare foto/video</Text>
            <Text style={styles.uploadSubtext}>Puoi selezionarne più di uno</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Descrizione</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Form descrizione in arrivo...</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Selector location in arrivo...</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Box Attività</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Qui potrai aggiungere i box con attività del tuo itinerario
            </Text>
          </View>
        </View>

        {selectedMedia.length > 0 && (
          <TouchableOpacity style={styles.changeMediaButton} onPress={handlePickMedia}>
            <Text style={styles.changeMediaText}>Cambia Media</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            selectedMedia.length === 0 && styles.createButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={selectedMedia.length === 0}>
          <Text style={styles.createButtonText}>Pubblica Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    padding: 60,
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
  },
  mediaThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  changeMediaButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
    padding: 12,
    marginBottom: 12,
  },
  changeMediaText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  createButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});