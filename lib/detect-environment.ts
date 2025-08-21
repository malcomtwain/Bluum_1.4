/**
 * Détection de l'environnement et capacités
 */

export function getEnvironmentCapabilities() {
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';
  
  return {
    isLocal,
    isVercel,
    isProduction: domain === 'bluum.pro',
    canProcessVideo: !isVercel, // FFmpeg ne marche PAS sur Vercel
    message: isVercel 
      ? '⚠️ Traitement vidéo désactivé sur bluum.pro (hébergé sur Vercel)'
      : '✅ Traitement vidéo disponible',
    recommendations: isVercel ? [
      'Option 1: Migrer vers un VPS (10€/mois) pour activer les vidéos',
      'Option 2: Utiliser Cloudinary API (25€/1000 vidéos)',
      'Option 3: Garder Vercel mais désactiver les fonctions vidéo'
    ] : []
  };
}

/**
 * Vérifier si on peut traiter des vidéos
 */
export function canProcessVideos(): boolean {
  const { canProcessVideo } = getEnvironmentCapabilities();
  
  if (!canProcessVideo) {
    console.warn(`
╔════════════════════════════════════════════════════════╗
║                    ⚠️  ATTENTION                        ║
║                                                        ║
║  Traitement vidéo DÉSACTIVÉ sur bluum.pro             ║
║  Raison: Hébergé sur Vercel (pas de support FFmpeg)   ║
║                                                        ║
║  Solutions:                                            ║
║  1. Migrer vers VPS/Railway (10€/mois)                ║
║  2. Utiliser l'API Cloudinary                         ║
║  3. Désactiver les fonctions vidéo en production      ║
╚════════════════════════════════════════════════════════╝
    `);
  }
  
  return canProcessVideo;
}