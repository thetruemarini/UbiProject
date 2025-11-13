// services/cloudinary.service.ts
import * as ImagePicker from 'expo-image-picker';

class CloudinaryService {
  // Le tue credenziali Cloudinary
  private cloudName = 'doglcod8f'; // es: 'dxyz123abc'
  private uploadPreset = 'ubivais_uploads'; 
  
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
      
      // Crea oggetto file da URI
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        type,
        name: filename,
      } as any);
      
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