/**
 * storageService.ts
 * Reliable image uploader with multiple fallbacks:
 * 1. Catbox (free permanent CDN image hosting, no key needed)
 * 2. ImgBB (if key provided & working)
 * 3. Base64 Data URI (native offline/online fallback, guaranteed to display)
 */

import * as FileSystem from 'expo-file-system/legacy';

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY || '';

/**
 * Upload a local image URI (from expo-image-picker) and return a permanent image URL.
 */
export async function uploadTripImage(localUri: string): Promise<string> {
  // 1. Try uploading to Catbox (free, permanent, fast image CDN)
  try {
    const uploadResult = await FileSystem.uploadAsync('https://catbox.moe/user/api.php', localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'fileToUpload',
      parameters: {
        reqtype: 'fileupload',
      },
    });

    if (uploadResult.status === 200 && uploadResult.body && uploadResult.body.startsWith('http')) {
      return uploadResult.body.trim();
    }
  } catch (err) {
    console.warn('Catbox upload attempt failed, trying fallback:', err);
  }

  // 2. Try ImgBB if key exists
  if (IMGBB_API_KEY) {
    try {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?.url) {
          return json.data.url as string;
        }
      }
    } catch (imgbbErr) {
      console.warn('ImgBB fallback attempt failed:', imgbbErr);
    }
  }

  // 3. Fallback: Base64 Data URI (guaranteed to render natively on mobile and web)
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (fallbackErr) {
    console.warn('Base64 fallback failed, returning local URI:', fallbackErr);
    return localUri;
  }
}
