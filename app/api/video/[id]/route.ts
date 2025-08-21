import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    
    // Sécurité : s'assurer que l'ID ne contient pas de caractères dangereux
    if (!videoId || !/^[a-zA-Z0-9_-]+\.mp4$/.test(videoId)) {
      return new NextResponse('Invalid video ID', { status: 400 });
    }
    
    // Déterminer le chemin selon l'environnement
    const videoDir = process.env.NODE_ENV === 'production' ? '/tmp' : join(process.cwd(), 'public', 'temp-videos');
    const videoPath = join(videoDir, videoId);
    
    // Vérifier que le fichier existe
    if (!existsSync(videoPath)) {
      return new NextResponse('Video not found', { status: 404 });
    }
    
    // Obtenir les informations du fichier
    const stats = await stat(videoPath);
    const fileSize = stats.size;
    
    // Gérer les requêtes de plage (pour le streaming vidéo)
    const range = request.headers.get('range');
    
    if (range) {
      // Parse Range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      // Lire la partie demandée du fichier
      const videoBuffer = await readFile(videoPath);
      const chunk = videoBuffer.slice(start, end + 1);
      
      // Retourner la réponse partielle
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=900', // Cache 15 minutes
        },
      });
    } else {
      // Retourner le fichier complet
      const videoBuffer = await readFile(videoPath);
      
      return new NextResponse(videoBuffer, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=900', // Cache 15 minutes
        },
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}