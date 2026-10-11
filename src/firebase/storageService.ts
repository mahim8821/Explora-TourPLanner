/**
 * storageService.ts
 * Upload images to ImgBB (free image hosting, no Firebase Storage needed).
 *
 * API docs: https://api.imgbb.com
 * Strategy: read file as base64 with expo-file-system → POST to ImgBB API
 *            → return the permanent display URL.
 */

import * as FileSystem from 'expo-file-system/legacy';

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY || '';

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload a local image URI (from expo-image-picker) to ImgBB.
 * Returns the permanent public URL of the uploaded image.
 */
export async function uploadTripImage(localUri: string): Promise<string> {
  // 1. Read the file as a base64 string (native — no blob warning)
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Build multipart form body
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64);

  // 3. POST to ImgBB
  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ImgBB upload failed (${response.status}): ${text}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`ImgBB error: ${json.error?.message ?? 'Unknown error'}`);
  }

  // Return the direct display URL (works as an <Image> source)
  return json.data.url as string;
}
