// services/cloudinary.service.ts
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Le variabili EXPO_PUBLIC_* vanno lette con accesso statico (process.env.NOME):
// Expo le sostituisce nel bundle solo in questa forma
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variabile d'ambiente mancante: ${name}. Aggiungila al file .env (vedi .env.example).`);
  }
  return value;
}

class CloudinaryService {
  private cloudName = requireEnv('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME', process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
  private uploadPreset = requireEnv('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  async requestMediaPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

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

  async uploadFile(uri: string, userId: string) {
    try {
      const formData = new FormData();

      // expo/fetch (fetch globale da SDK 56) non accetta { uri, type, name }:
      // serve un File di expo-file-system (nome e mime type ricavati dal file)
      formData.append('file', new File(uri));

      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', `ubivais/${userId}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, url: data.secure_url };
      } else {
        console.error('Cloudinary error:', data);
        return { success: false, error: data.error?.message || 'Upload fallito' };
      }
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      return { success: false, error: error.message };
    }
  }

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

  async uploadProfilePicture(uri: string, userId: string) {
    return this.uploadFile(uri, userId);
  }
}

export default new CloudinaryService();