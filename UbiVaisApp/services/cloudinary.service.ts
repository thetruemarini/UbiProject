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

// MIME type dall'estensione dell'URI (normalizzata in minuscolo), default image/jpeg
function getMimeType(uri: string): string {
  const extension = uri.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'heic':
      return 'image/heic';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

class CloudinaryService {
  private cloudName = requireEnv('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME', process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
  private uploadPreset = requireEnv('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  async requestMediaPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async pickMedia(
    allowsMultiple: boolean = true,
    mediaTypes: 'images' | 'videos' | 'all' = 'all',
    selectionLimit: number = 10
  ) {
    const hasPermission = await this.requestMediaPermissions();
    if (!hasPermission) {
      return { success: false, error: 'Permessi negati' };
    }

    try {
      const mediaTypeMapping: Record<typeof mediaTypes, ImagePicker.MediaType[]> = {
        images: ['images'],
        videos: ['videos'],
        all: ['images', 'videos'],
      };

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeMapping[mediaTypes],
        allowsMultipleSelection: allowsMultiple,
        selectionLimit,
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
      // serializza le parti che espongono name, type e bytes(). Si usa il File di
      // expo-file-system per i byte, ma con il MIME type ricavato dall'estensione
      const file = new File(uri);
      const filePart = {
        name: file.name,
        type: getMimeType(uri),
        bytes: () => file.bytes(),
      };
      formData.append('file', filePart as unknown as Blob);

      formData.append('upload_preset', this.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          // Niente Content-Type: lo genera fetch con il boundary corretto
          body: formData,
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

      const failedCount = results.filter((result) => !result.success).length;
      if (failedCount > 0) {
        return {
          success: false,
          error: `${failedCount} foto su ${uris.length} non sono state caricate`,
        };
      }

      const urls = results.map((result) => result.url!);

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