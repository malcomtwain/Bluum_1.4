import { upload } from '@vercel/blob/client';

/**
 * Upload a file to Vercel Blob Storage
 * @param file - The file to upload (as Blob or base64 string)
 * @param filename - The name for the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToBlob(file: Blob | string, filename: string): Promise<string> {
  try {
    let blob: Blob;
    
    // Si c'est une string base64, la convertir en Blob
    if (typeof file === 'string') {
      // Enlever le préfixe data URL si présent
      const base64Data = file.split(',')[1] || file;
      const mimeMatch = file.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      // Convertir base64 en Blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      blob = file;
    }
    
    // Upload vers Vercel Blob en utilisant l'API client
    const result = await upload(filename, blob, {
      access: 'public',
      handleUploadUrl: '/api/upload-url', // Endpoint pour obtenir l'URL d'upload
    });
    
    return result.url;
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple files to Vercel Blob Storage
 * @param files - Array of files with their names
 * @returns Array of public URLs
 */
export async function uploadMultipleToBlob(
  files: Array<{ file: Blob | string; filename: string }>
): Promise<string[]> {
  try {
    const uploadPromises = files.map(({ file, filename }) => 
      uploadToBlob(file, filename)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files to Vercel Blob:', error);
    throw error;
  }
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}