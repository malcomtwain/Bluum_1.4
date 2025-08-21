/**
 * Traitement vidéo avec Cloudinary
 * Alternative à FFmpeg pour les environnements serverless comme Vercel
 */

import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface VideoTransformation {
  width?: number;
  height?: number;
  crop?: string;
  duration?: number;
  format?: string;
  quality?: string | number;
}

/**
 * Upload une vidéo sur Cloudinary et retourne l'URL
 */
export async function uploadVideoToCloudinary(
  filePath: string,
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      public_id: publicId,
      folder: 'bluum-videos',
      overwrite: true
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    throw error;
  }
}

/**
 * Transforme une vidéo avec Cloudinary
 */
export function transformVideo(
  publicId: string,
  transformations: VideoTransformation[]
): string {
  const transformationArray = transformations.map(t => {
    const params: any = {};
    
    if (t.width) params.width = t.width;
    if (t.height) params.height = t.height;
    if (t.crop) params.crop = t.crop;
    if (t.duration) params.duration = t.duration;
    if (t.quality) params.quality = t.quality;
    if (t.format) params.format = t.format;
    
    return params;
  });
  
  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: transformationArray,
    secure: true
  });
}

/**
 * Concatène plusieurs vidéos avec Cloudinary
 */
export async function concatenateVideos(
  videoPublicIds: string[],
  outputPublicId: string,
  audioPublicId?: string
): Promise<string> {
  try {
    // Créer une transformation de concaténation
    const transformation: any[] = [];
    
    // Ajouter chaque vidéo comme layer
    videoPublicIds.forEach((publicId, index) => {
      if (index === 0) {
        transformation.push({
          overlay: `video:${publicId.replace(/\//g, ':')}`,
          flags: 'splice'
        });
      } else {
        transformation.push({
          overlay: `video:${publicId.replace(/\//g, ':')}`,
          flags: 'splice',
          gravity: 'north_east'
        });
      }
    });
    
    // Ajouter l'audio si fourni
    if (audioPublicId) {
      transformation.push({
        overlay: `video:${audioPublicId.replace(/\//g, ':')}`,
        flags: 'layer_apply',
        resource_type: 'video'
      });
    }
    
    // Générer l'URL de la vidéo concaténée
    const url = cloudinary.url(outputPublicId, {
      resource_type: 'video',
      transformation,
      secure: true
    });
    
    return url;
  } catch (error) {
    console.error('Error concatenating videos:', error);
    throw error;
  }
}

/**
 * Scale et crop une vidéo pour le format vertical (1080x1920)
 */
export function scaleVideoForVertical(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: [
      {
        width: 1080,
        height: 1920,
        crop: 'fill',
        gravity: 'center'
      },
      {
        quality: 'auto:good',
        format: 'mp4'
      }
    ],
    secure: true
  });
}

/**
 * Crée une vidéo à partir d'une image avec durée
 */
export function imageToVideo(imagePublicId: string, duration: number): string {
  return cloudinary.url(imagePublicId, {
    resource_type: 'video',
    transformation: [
      {
        width: 1080,
        height: 1920,
        crop: 'fill',
        duration: duration
      },
      {
        format: 'mp4'
      }
    ],
    secure: true
  });
}

/**
 * Ajoute un overlay de texte sur une vidéo
 */
export function addTextOverlay(
  videoPublicId: string,
  text: string,
  position: 'top' | 'middle' | 'bottom' = 'top',
  style: number = 1
): string {
  const gravityMap = {
    top: 'north',
    middle: 'center',
    bottom: 'south'
  };
  
  const textStyle = style === 1
    ? { color: 'white', font_size: 60 }
    : style === 2
    ? { color: 'black', font_size: 65, background: 'white' }
    : { color: 'white', font_size: 65, background: 'black' };
  
  return cloudinary.url(videoPublicId, {
    resource_type: 'video',
    transformation: [
      {
        overlay: {
          font_family: 'Arial',
          font_size: textStyle.font_size,
          font_weight: 'bold',
          text: encodeURIComponent(text)
        },
        color: textStyle.color,
        background: textStyle.background,
        gravity: gravityMap[position],
        y: position === 'top' ? 100 : position === 'bottom' ? 100 : 0
      }
    ],
    secure: true
  });
}

/**
 * Vérifie si nous devons utiliser Cloudinary pour le traitement vidéo
 */
export function shouldUseCloudinary(): boolean {
  // Utiliser Cloudinary sur Vercel ou si FFmpeg n'est pas disponible
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  const hasCloudinaryConfig = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  
  return !!(isVercel && hasCloudinaryConfig);
}