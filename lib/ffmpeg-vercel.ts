/**
 * Configuration FFmpeg optimisée pour Vercel
 * 
 * Sur Vercel, nous devons gérer les chemins différemment car
 * l'environnement serverless a une structure de fichiers spécifique
 */

export function getVercelFFmpegPath(): string {
  const fs = require('fs');
  const path = require('path');
  
  console.log('🔍 Searching for FFmpeg on Vercel...');
  
  // Liste des chemins possibles pour FFmpeg sur Vercel
  const possiblePaths = [
    // Chemins pour ffmpeg-static
    '/var/task/node_modules/ffmpeg-static/ffmpeg',
    '/var/task/node_modules/ffmpeg-static/bin/linux/x64/ffmpeg',
    '/var/task/node_modules/ffmpeg-static/bin/linux/ffmpeg',
    
    // Chemins pour @ffmpeg-installer/ffmpeg
    '/var/task/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg',
    '/var/task/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    '/var/task/node_modules/@ffmpeg-installer/ffmpeg/linux-x64/ffmpeg',
    
    // Autres chemins possibles
    '/opt/nodejs/node_modules/ffmpeg-static/ffmpeg',
    '/opt/bin/ffmpeg',
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
  ];

  // Tester chaque chemin
  for (const testPath of possiblePaths) {
    try {
      if (fs.existsSync(testPath)) {
        const stats = fs.statSync(testPath);
        if (stats.isFile()) {
          console.log(`✅ Found FFmpeg at: ${testPath}`);
          return testPath;
        }
      }
    } catch (e) {
      // Ignorer les erreurs d'accès
    }
  }

  // Si on n'a pas trouvé, essayer de récupérer depuis ffmpeg-static
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      console.log(`📦 ffmpeg-static returns: ${ffmpegStatic}`);
      
      // Si c'est un chemin absolu et qu'il existe
      if (path.isAbsolute(ffmpegStatic) && fs.existsSync(ffmpegStatic)) {
        console.log(`✅ Using ffmpeg-static path: ${ffmpegStatic}`);
        return ffmpegStatic;
      }
      
      // Si c'est un chemin relatif, essayer de le résoudre
      if (!path.isAbsolute(ffmpegStatic)) {
        const resolvedPath = path.resolve('/var/task/node_modules/ffmpeg-static', ffmpegStatic);
        if (fs.existsSync(resolvedPath)) {
          console.log(`✅ Resolved ffmpeg-static to: ${resolvedPath}`);
          return resolvedPath;
        }
      }
    }
  } catch (e: any) {
    console.log('⚠️ ffmpeg-static not available:', e.message);
  }

  // Essayer @ffmpeg-installer/ffmpeg
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller && ffmpegInstaller.path) {
      console.log(`📦 @ffmpeg-installer/ffmpeg returns: ${ffmpegInstaller.path}`);
      
      if (fs.existsSync(ffmpegInstaller.path)) {
        console.log(`✅ Using @ffmpeg-installer/ffmpeg: ${ffmpegInstaller.path}`);
        return ffmpegInstaller.path;
      }
    }
  } catch (e: any) {
    console.log('⚠️ @ffmpeg-installer/ffmpeg not available:', e.message);
  }

  // En dernier recours, lister le contenu des répertoires pour debug
  console.log('❌ FFmpeg not found. Listing directories for debugging:');
  
  try {
    const nodeModulesPath = '/var/task/node_modules';
    if (fs.existsSync(nodeModulesPath)) {
      // Lister les packages ffmpeg
      const packages = fs.readdirSync(nodeModulesPath);
      const ffmpegPackages = packages.filter((p: string) => p.includes('ffmpeg'));
      console.log('FFmpeg packages in node_modules:', ffmpegPackages);
      
      // Chercher dans ffmpeg-static
      if (fs.existsSync(path.join(nodeModulesPath, 'ffmpeg-static'))) {
        const ffmpegStaticContents = fs.readdirSync(path.join(nodeModulesPath, 'ffmpeg-static'));
        console.log('ffmpeg-static contents:', ffmpegStaticContents);
      }
    }
  } catch (e: any) {
    console.log('Could not list directories:', e.message);
  }

  console.error('❌ FFmpeg binary not found on Vercel after exhaustive search');
  console.error('Falling back to system ffmpeg command (likely to fail)');
  
  // Retourner ffmpeg par défaut au lieu de lancer une exception
  // Cela permettra au moins de voir les logs d'erreur plus détaillés
  return 'ffmpeg';
}