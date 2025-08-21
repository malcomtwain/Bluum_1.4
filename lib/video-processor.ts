/**
 * Processeur vidéo hybride
 * Utilise FFmpeg localement et une solution alternative sur Vercel
 */

import { getFFmpegPath } from './ffmpeg-config';

export interface VideoProcessor {
  isAvailable: boolean;
  type: 'ffmpeg' | 'cloudinary' | 'none';
  processVideo: (input: string, output: string, options: any) => Promise<void>;
}

/**
 * Détecte le processeur vidéo disponible
 */
export async function getVideoProcessor(): Promise<VideoProcessor> {
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  
  if (isVercel) {
    console.log('📹 Vercel detected - FFmpeg not available');
    console.log('ℹ️ Video processing disabled on Vercel');
    console.log('💡 Consider using Cloudinary, AWS MediaConvert, or deploying on a different platform');
    
    // Sur Vercel, retourner un processeur qui échoue avec un message clair
    return {
      isAvailable: false,
      type: 'none',
      processVideo: async () => {
        throw new Error(
          'Video processing is not available on Vercel. ' +
          'FFmpeg cannot run in Vercel\'s serverless environment. ' +
          'Please use one of these alternatives:\n' +
          '1. Deploy on Railway, Render, or Fly.io instead\n' +
          '2. Use Cloudinary API for video processing\n' +
          '3. Use AWS MediaConvert or similar service\n' +
          '4. Process videos client-side with FFmpeg.wasm'
        );
      }
    };
  }
  
  // Essayer d'utiliser FFmpeg local
  try {
    const ffmpegPath = getFFmpegPath();
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Tester si FFmpeg fonctionne
    await execPromise(`${ffmpegPath} -version`);
    
    console.log('✅ FFmpeg is available');
    
    return {
      isAvailable: true,
      type: 'ffmpeg',
      processVideo: async (input: string, output: string, options: any) => {
        // Implémentation FFmpeg normale
        const command = `${ffmpegPath} -i "${input}" ${options} "${output}"`;
        await execPromise(command);
      }
    };
  } catch (error) {
    console.error('❌ FFmpeg not available:', error);
    
    return {
      isAvailable: false,
      type: 'none',
      processVideo: async () => {
        throw new Error('No video processor available');
      }
    };
  }
}

/**
 * Message d'erreur pour Vercel
 */
export function getVercelErrorMessage(): string {
  return `
🚫 Video Processing Not Available on Vercel

Vercel's serverless functions don't support FFmpeg binary execution.

Solutions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Use Alternative Hosting (Recommended)
   Deploy your app on platforms that support FFmpeg:
   • Railway.app - Easy deployment with FFmpeg support
   • Render.com - Free tier available
   • Fly.io - Great for video processing
   • Heroku - With buildpack support
   • DigitalOcean App Platform

2️⃣  Use Video Processing APIs
   • Cloudinary - Already integrated for uploads
   • AWS MediaConvert - Scalable solution
   • Mux - Video infrastructure
   • Transloadit - File processing

3️⃣  Client-Side Processing
   • FFmpeg.wasm - Run FFmpeg in the browser
   • Limited by browser memory and performance

4️⃣  Hybrid Approach
   • Keep frontend on Vercel
   • Deploy video processing API separately
   • Use serverless functions on AWS Lambda with FFmpeg Layer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For immediate solution, we recommend deploying on Railway.app
which has native FFmpeg support and easy migration from Vercel.
`;
}