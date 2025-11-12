// services/storage.service.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';

class StorageService {
  // Richiedi permessi
  async requestMediaPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // Seleziona immagini/video
  async pickMedia(allowsMultiple: boolean = true, mediaTypes: 'images' | 'videos' | 'all' = 'all') {
    const hasPermission = await this.requestMediaPermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permessi negati' };
    }

    try {
      const mediaTypeMapping = {
        images: ImagePicker.MediaTypeOptions.Images,
        videos: ImagePicker.MediaTypeOptions.Videos,
        all: ImagePicker.MediaTypeOptions.All,
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeMapping[mediaTypes],
        allowsMultipleSelection: allowsMultiple,
        quality: 0.8,
        videoMaxDuration: 60, // max 60 secondi
      });

      if (result.canceled) {
        return { success: false, error: 'Selezione annullata' };
      }

      return { success: true, assets: result.assets };
    } catch (error: any) {
      console.error('Error picking media:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload singolo file
  async uploadFile(uri: string, userId: string, type: 'post' | 'profile' = 'post') {
    try {
      // Fetch del file locale
      const response = await fetch(uri);
      const blob = await response.blob();

      // Genera nome univoco
      const timestamp = Date.now();
      const filename = `${type}s/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload
      await uploadBytes(storageRef, blob);

      // Get URL pubblico
      const downloadURL = await getDownloadURL(storageRef);

      return { success: true, url: downloadURL };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload multipli
  async uploadMultipleFiles(uris: string[], userId: string) {
    try {
      const uploadPromises = uris.map((uri) => this.uploadFile(uri, userId));
      const results = await Promise.all(uploadPromises);

      const urls = results
        .filter((result) => result.success)
        .map((result) => result.url!);

      if (urls.length === 0) {
        return { success: false, error: 'Nessun file caricato' };
      }

      return { success: true, urls };
    } catch (error: any) {
      console.error('Error uploading multiple files:', error);
      return { success: false, error: error.message };
    }
  }

  // Elimina file
  async deleteFile(fileUrl: string) {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload foto profilo
  async uploadProfilePicture(uri: string, userId: string) {
    return this.uploadFile(uri, userId, 'profile');
  }
}

export default new StorageService();