import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';

/**
 * Upload a video file to Vercel Blob Storage in production
 * @param filePath - The local file path of the video
 * @param fileName - The name for the file in Blob storage
 * @returns The public URL of the uploaded video
 */
export async function uploadVideoToBlob(filePath: string, fileName: string): Promise<string> {
  try {
    // Read the file from the temp directory
    const fileBuffer = await readFile(filePath);
    
    // Upload to Vercel Blob
    const { url } = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: 'video/mp4',
    });
    
    return url;
  } catch (error) {
    console.error('Error uploading video to Vercel Blob:', error);
    throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}