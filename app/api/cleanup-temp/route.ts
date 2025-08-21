import { NextResponse } from 'next/server';
import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const tempDir = process.env.NODE_ENV === 'production' ? '/tmp' : join(process.cwd(), 'public', 'temp-videos');
    
    // Lire tous les fichiers dans le dossier temporaire
    const files = await readdir(tempDir);
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      // Ignorer les fichiers non-vidéo
      if (!file.endsWith('.mp4')) continue;
      
      const filePath = join(tempDir, file);
      
      try {
        // Vérifier l'âge du fichier
        const stats = await stat(filePath);
        const fileAge = now - stats.mtimeMs;
        
        // Supprimer si plus vieux que 15 minutes
        if (fileAge > fifteenMinutes) {
          await unlink(filePath);
          deletedCount++;
          console.log(`Deleted old temp file: ${file}`);
          
          // Essayer de supprimer le fichier meta associé
          try {
            await unlink(join(tempDir, `${file}.meta.json`));
          } catch {
            // Ignorer si le fichier meta n'existe pas
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} old temporary files`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}