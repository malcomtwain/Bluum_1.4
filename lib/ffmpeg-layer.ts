/**
 * Configuration FFmpeg utilisant une Lambda Layer ou des binaires externes
 * Solution alternative pour Vercel
 */

export function getFFmpegCommand(): string {
  // Sur Vercel, essayer d'utiliser ffmpeg via une commande shell directe
  // ou via un service externe
  
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  
  if (isVercel) {
    console.log('🎬 Using FFmpeg Layer/External solution for Vercel');
    
    // Option 1: Utiliser un binaire ffmpeg pré-installé sur Vercel
    // Vercel inclut certains binaires dans leur environnement
    const possibleCommands = [
      '/usr/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/opt/bin/ffmpeg',
      'ffmpeg'
    ];
    
    const { execSync } = require('child_process');
    
    for (const cmd of possibleCommands) {
      try {
        // Tester si la commande existe
        execSync(`which ${cmd}`, { stdio: 'pipe' });
        console.log(`✅ Found working ffmpeg command: ${cmd}`);
        return cmd;
      } catch (e) {
        // Commande non trouvée, essayer la suivante
      }
    }
    
    // Option 2: Utiliser un wrapper qui télécharge ffmpeg à la demande
    console.log('⚠️ No system ffmpeg found, using fallback');
    return 'ffmpeg';
  }
  
  // En local ou autres environnements
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    return ffmpegInstaller.path;
  } catch (e) {
    try {
      const ffmpegStatic = require('ffmpeg-static');
      return ffmpegStatic;
    } catch (e2) {
      return 'ffmpeg';
    }
  }
}