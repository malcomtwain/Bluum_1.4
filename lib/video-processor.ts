/**
 * Processeur vidéo utilisant FFmpeg
 */

import { getFFmpegPath } from './ffmpeg-config';

export interface VideoProcessor {
  isAvailable: boolean;
  type: 'ffmpeg' | 'none';
  processVideo: (input: string, output: string, options: any) => Promise<void>;
}

/**
 * Détecte le processeur vidéo disponible
 */
export async function getVideoProcessor(): Promise<VideoProcessor> {
  const isRender = process.env.RENDER === 'true' || process.env.IS_PULL_REQUEST;
  
  // Sur Render, FFmpeg est disponible
  if (isRender) {
    console.log('🚀 Render.com detected - FFmpeg is available!');
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

