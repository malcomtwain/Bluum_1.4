/**
 * Upload files to Cloudinary
 * This runs on the client side using the unsigned upload preset
 */

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * Upload a file to Cloudinary using unsigned upload
 * @param file - The file to upload (File or Blob)
 * @param resourceType - Type of resource ('video', 'image', 'raw', 'auto')
 * @returns The Cloudinary URL of the uploaded file
 */
export async function uploadToCloudinary(
  file: File | Blob,
  resourceType: 'video' | 'image' | 'raw' | 'auto' = 'auto'
): Promise<string> {
  // Get Cloudinary config from environment variables
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }
  
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', resourceType);
  
  // Add timestamp to avoid caching issues
  formData.append('timestamp', Date.now().toString());
  
  try {
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary upload failed: ${error}`);
    }
    
    const data: CloudinaryUploadResponse = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Upload a base64 string to Cloudinary
 * @param base64String - The base64 string (with or without data URL prefix)
 * @param resourceType - Type of resource
 * @returns The Cloudinary URL
 */
export async function uploadBase64ToCloudinary(
  base64String: string,
  resourceType: 'video' | 'image' | 'raw' | 'auto' = 'auto'
): Promise<string> {
  // Convert base64 to blob
  const base64Data = base64String.split(',')[1] || base64String;
  const mimeMatch = base64String.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  return uploadToCloudinary(blob, resourceType);
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @returns Array of Cloudinary URLs
 */
export async function uploadMultipleToCloudinary(
  files: (File | Blob)[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const resourceType = file.type?.startsWith('video/') ? 'video' : 
                        file.type?.startsWith('image/') ? 'image' : 'auto';
    
    try {
      const url = await uploadToCloudinary(file, resourceType);
      urls.push(url);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to upload file ${i + 1}:`, error);
      throw error;
    }
  }
  
  return urls;
}