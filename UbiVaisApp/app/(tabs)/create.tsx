// app/(tabs)/create.tsx - CON BOX ESPERIENZE
import { useAuth } from '@/contexts/auth-context';
import StorageService from '@/services/cloudinary.service';
import PostService from '@/services/post.service';
import { BoxCategory, ItineraryBox } from '@/types';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Emoji per categorie
const CATEGORY_EMOJI: Record<BoxCategory, string> = {
  food: '🍕',
  experience: '🎭',
  sport: '🏃',
  culture: '🏛️',
  nature: '🌿',
  nightlife: '🌙',
  shopping: '🛍️',
  accommodation: '🏨',
  transport: '🚗',
  other: '✨',
};

const CATEGORY_LABELS: Record<BoxCategory, string> = {
  food: 'Cibo',
  experience: 'Esperienza',
  sport: 'Sport',
  culture: 'Cultura',
  nature: 'Natura',
  nightlife: 'Vita notturna',
  shopping: 'Shopping',
  accommodation: 'Alloggio',
  transport: 'Trasporto',
  other: 'Altro',
};

export default function CreateScreen() {
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);

  // Stati per Box Esperienze
  const [boxes, setBoxes] = useState<ItineraryBox[]>([]);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [editingBoxIndex, setEditingBoxIndex] = useState<number | null>(null);

  // Stati per form box
  const [boxTitle, setBoxTitle] = useState('');
  const [boxCategory, setBoxCategory] = useState<BoxCategory>('experience');
  const [boxDescription, setBoxDescription] = useState('');
  const [boxLocationName, setBoxLocationName] = useState('');
  const [boxAddress, setBoxAddress] = useState('');
  const [boxRating, setBoxRating] = useState<number | undefined>(undefined);
  const [boxDuration, setBoxDuration] = useState('');
  const [boxTips, setBoxTips] = useState('');

  const handlePickMedia = async () => {
    const result = await StorageService.pickMedia(true, 'images');

    if (result.success && result.assets) {
      setSelectedMedia(result.assets);
    } else if (result.error && result.error !== 'Selezione annullata') {
      Alert.alert('Errore', result.error);
    }
  };

  const openAddBoxModal = () => {
    resetBoxForm();
    setEditingBoxIndex(null);
    setShowBoxModal(true);
  };

  const openEditBoxModal = (index: number) => {
    const box = boxes[index];
    setBoxTitle(box.title);
    setBoxCategory(box.category);
    setBoxDescription(box.description);
    setBoxLocationName(box.location?.name || '');
    setBoxAddress(box.location?.address || '');
    setBoxRating(box.rating);
    setBoxDuration(box.duration ? box.duration.toString() : '');
    setBoxTips(box.tips || '');
    setEditingBoxIndex(index);
    setShowBoxModal(true);
  };

  const resetBoxForm = () => {
    setBoxTitle('');
    setBoxCategory('experience');
    setBoxDescription('');
    setBoxLocationName('');
    setBoxAddress('');
    setBoxRating(undefined);
    setBoxDuration('');
    setBoxTips('');
  };

  const handleSaveBox = () => {
    if (!boxTitle.trim()) {
      Alert.alert('Attenzione', 'Inserisci un titolo per il box');
      return;
    }

    if (!user) return;

    const newBox: ItineraryBox = {
      id: Date.now().toString(),
      title: boxTitle.trim(),
      description: boxDescription.trim(),
      category: boxCategory,
      location: boxLocationName.trim() ? {
        name: boxLocationName.trim(),
        address: boxAddress.trim() || undefined,
      } : undefined,
      rating: boxRating,
      duration: boxDuration ? parseInt(boxDuration) : undefined,
      tips: boxTips.trim() || undefined,
      createdBy: user.id,
      createdAt: new Date(),
    };

    if (editingBoxIndex !== null) {
      // Modifica box esistente
      const updatedBoxes = [...boxes];
      updatedBoxes[editingBoxIndex] = newBox;
      setBoxes(updatedBoxes);
    } else {
      // Aggiungi nuovo box
      setBoxes([...boxes, newBox]);
    }

    setShowBoxModal(false);
    resetBoxForm();
  };

  const handleDeleteBox = (index: number) => {
    Alert.alert(
      'Elimina Box',
      'Sei sicuro di voler eliminare questo box?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            setBoxes(boxes.filter((_, i) => i !== index));
          },
        },
      ]
    );
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
      console.log('📤 Upload immagini...');
      const uris = selectedMedia.map(media => media.uri);
      const uploadResult = await StorageService.uploadMultipleFiles(uris, user.id);

      if (!uploadResult.success) {
        Alert.alert('Errore Upload', uploadResult.error || 'Impossibile caricare le immagini');
        setUploading(false);
        return;
      }

      console.log('✅ Immagini caricate:', uploadResult.urls);

      console.log('💾 Creazione post...');
      const postResult = await PostService.createPost(
        user.id,
        caption.trim(),
        uploadResult.urls!,
        boxes, // Passa i box al post
        location.trim() ? { name: location.trim() } : undefined
      );

      if (!postResult.success) {
        Alert.alert('Errore', postResult.error || 'Impossibile creare il post');
        setUploading(false);
        return;
      }

      console.log('✅ Post creato con ID:', postResult.postId);

      Alert.alert(
        'Post pubblicato! 🎉',
        boxes.length > 0
          ? `Il tuo post con ${boxes.length} box è stato pubblicato!`
          : 'Il tuo post è stato pubblicato con successo',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedMedia([]);
              setCaption('');
              setLocation('');
              setBoxes([]);
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

  const renderStars = (currentRating?: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setBoxRating(star === currentRating ? undefined : star)}
            style={styles.starButton}>
            <Text style={styles.starText}>
              {currentRating && star <= currentRating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={styles.scrollContent}>

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
              textAlignVertical="top"
              returnKeyType="default"
              blurOnSubmit={false}
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
              returnKeyType="done"
            />
          </View>

          {/* Box Esperienze Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>✨ Esperienze del posto</Text>
              <Text style={styles.sectionSubtext}>{boxes.length} box aggiunti</Text>
            </View>

            {/* Lista Box */}
            {boxes.map((box, index) => (
              <View key={box.id} style={styles.boxCard}>
                <View style={styles.boxCardHeader}>
                  <View style={styles.boxCardTitleRow}>
                    <Text style={styles.boxEmoji}>{CATEGORY_EMOJI[box.category]}</Text>
                    <View style={styles.boxCardTitleContainer}>
                      <Text style={styles.boxCardTitle}>{box.title}</Text>
                      <Text style={styles.boxCardCategory}>
                        {CATEGORY_LABELS[box.category]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.boxCardActions}>
                    <TouchableOpacity
                      style={styles.boxActionButton}
                      onPress={() => openEditBoxModal(index)}>
                      <Text style={styles.boxActionText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.boxActionButton}
                      onPress={() => handleDeleteBox(index)}>
                      <Text style={styles.boxActionText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {box.description && (
                  <Text style={styles.boxCardDescription} numberOfLines={2}>
                    {box.description}
                  </Text>
                )}

                <View style={styles.boxCardMeta}>
                  {box.rating && (
                    <View style={styles.boxMetaItem}>
                      <Text style={styles.boxMetaText}>
                        {'⭐'.repeat(box.rating)}
                      </Text>
                    </View>
                  )}
                  {box.duration && (
                    <View style={styles.boxMetaItem}>
                      <Text style={styles.boxMetaText}>⏱ {box.duration} min</Text>
                    </View>
                  )}
                  {box.location && (
                    <View style={styles.boxMetaItem}>
                      <Text style={styles.boxMetaText} numberOfLines={1}>
                        📍 {box.location.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Pulsante Aggiungi Box */}
            <TouchableOpacity
              style={styles.addBoxButton}
              onPress={openAddBoxModal}
              disabled={uploading}>
              <Text style={styles.addBoxButtonText}>+ Aggiungi Esperienza</Text>
            </TouchableOpacity>
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

      {/* Modal Aggiungi/Modifica Box */}
      <Modal
        visible={showBoxModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBoxModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBoxModal(false)}>
              <Text style={styles.modalCancelButton}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingBoxIndex !== null ? 'Modifica Box' : 'Nuovo Box'}
            </Text>
            <TouchableOpacity onPress={handleSaveBox}>
              <Text style={styles.modalSaveButton}>Salva</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Titolo */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Titolo *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Es: Ristorante La Piazzetta"
                placeholderTextColor="#999"
                value={boxTitle}
                onChangeText={setBoxTitle}
                maxLength={100}
              />
            </View>

            {/* Categoria */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Categoria</Text>
              <View style={styles.categoryGrid}>
                {(Object.keys(CATEGORY_EMOJI) as BoxCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      boxCategory === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setBoxCategory(cat)}>
                    <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[cat]}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        boxCategory === cat && styles.categoryLabelActive,
                      ]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Descrizione */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Descrizione</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Descrivi questa esperienza..."
                placeholderTextColor="#999"
                value={boxDescription}
                onChangeText={setBoxDescription}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            {/* Posizione */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>📍 Posizione</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nome del luogo"
                placeholderTextColor="#999"
                value={boxLocationName}
                onChangeText={setBoxLocationName}
                maxLength={100}
              />
              <TextInput
                style={[styles.modalInput, styles.modalInputSpaced]}
                placeholder="Indirizzo (opzionale)"
                placeholderTextColor="#999"
                value={boxAddress}
                onChangeText={setBoxAddress}
                maxLength={200}
              />
            </View>

            {/* Rating */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>⭐ Valutazione</Text>
              {renderStars(boxRating)}
            </View>

            {/* Durata */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>⏱ Durata (minuti)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Es: 60"
                placeholderTextColor="#999"
                value={boxDuration}
                onChangeText={setBoxDuration}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            {/* Tips */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>💡 Consigli</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Suggerimenti o info utili..."
                placeholderTextColor="#999"
                value={boxTips}
                onChangeText={setBoxTips}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
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
  flex: {
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
    backgroundColor: '#fff',
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
  scrollContent: {
    paddingBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  sectionSubtext: {
    fontSize: 13,
    color: '#999',
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
  // Box Card Styles
  boxCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  boxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  boxCardTitleRow: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  boxEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  boxCardTitleContainer: {
    flex: 1,
  },
  boxCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  boxCardCategory: {
    fontSize: 12,
    color: '#999',
  },
  boxCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  boxActionButton: {
    padding: 4,
  },
  boxActionText: {
    fontSize: 18,
  },
  boxCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  boxCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boxMetaItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boxMetaText: {
    fontSize: 12,
    color: '#666',
  },
  addBoxButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  addBoxButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
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
  // Modal Styles
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
  modalCancelButton: {
    fontSize: 16,
    color: '#000',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalInputSpaced: {
    marginTop: 8,
  },
  modalTextArea: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#FFF5F2',
    borderColor: '#FF6B35',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 28,
  },
});
