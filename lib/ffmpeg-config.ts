/**
 * Configuration FFmpeg pour différents environnements de déploiement
 */

let ffmpegPath: string = 'ffmpeg';
let ffprobePath: string = 'ffprobe';
let isInitialized = false;

export function initializeFFmpeg(): { ffmpegPath: string; ffprobePath: string } {
  if (isInitialized) {
    return { ffmpegPath, ffprobePath };
  }

  if (typeof window === 'undefined') {
    try {
      // Détection de l'environnement
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
      const isNetlify = process.env.NETLIFY === 'true';
      const isLocal = !isVercel && !isNetlify;

      console.log('🎬 FFmpeg Configuration:');
      console.log('  - Environment:', isVercel ? 'Vercel' : isNetlify ? 'Netlify' : 'Local/Other');
      console.log('  - NODE_ENV:', process.env.NODE_ENV);
      console.log('  - Current directory:', process.cwd());

      if (isVercel) {
        // Sur Vercel, utiliser notre fonction spécialisée
        try {
          const { getVercelFFmpegPath } = require('./ffmpeg-vercel');
          ffmpegPath = getVercelFFmpegPath();
          console.log('  ✅ FFmpeg configured for Vercel:', ffmpegPath);
        } catch (e: any) {
          console.error('  ❌ Failed to configure FFmpeg for Vercel:', e.message);
          console.error('  Full error:', e);
          
          // Essayer un fallback basique
          try {
            const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
            ffmpegPath = ffmpegInstaller.path;
            console.log('  ✅ Fallback to @ffmpeg-installer/ffmpeg:', ffmpegPath);
          } catch (e2: any) {
            console.error('  ❌ @ffmpeg-installer/ffmpeg also failed:', e2.message);
            
            // En production sur Vercel, ne pas lancer d'exception mais logger l'erreur
            if (process.env.NODE_ENV === 'production') {
              console.error('CRITICAL: FFmpeg not available in production on Vercel');
              console.error('Falling back to system ffmpeg (may not work)');
              ffmpegPath = 'ffmpeg';
            } else {
              throw new Error('FFmpeg is required but not available on Vercel');
            }
          }
        }
      } else {
        // Pour les autres environnements, utiliser @ffmpeg-installer/ffmpeg
        try {
          const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
          ffmpegPath = ffmpegInstaller.path;
          console.log('  ✅ Using @ffmpeg-installer/ffmpeg:', ffmpegPath);
        } catch (e) {
          console.warn('  ⚠️ @ffmpeg-installer/ffmpeg not available, trying ffmpeg-static');
          try {
            const ffmpegStatic = require('ffmpeg-static');
            ffmpegPath = ffmpegStatic;
            console.log('  ✅ Using ffmpeg-static:', ffmpegPath);
          } catch (e2) {
            console.error('  ❌ No FFmpeg package available, using system ffmpeg');
            ffmpegPath = 'ffmpeg';
          }
        }
      }

      // Vérification finale
      if (!ffmpegPath || ffmpegPath === 'ffmpeg') {
        console.warn('  ⚠️ Using system ffmpeg, may not work in serverless environments');
      }

      isInitialized = true;
    } catch (error) {
      console.error('❌ Critical error initializing FFmpeg:', error);
      // En production sur Vercel, logger mais ne pas lancer d'exception
      if (process.env.VERCEL && process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: FFmpeg initialization failed in production');
        console.error('Details:', error);
        // Utiliser le fallback système
        ffmpegPath = 'ffmpeg';
        ffprobePath = 'ffprobe';
        isInitialized = true;
      }
    }
  }

  return { ffmpegPath, ffprobePath };
}

export function getFFmpegPath(): string {
  const { ffmpegPath } = initializeFFmpeg();
  return ffmpegPath;
}

export function getFFprobePath(): string {
  const { ffprobePath } = initializeFFmpeg();
  return ffprobePath;
}