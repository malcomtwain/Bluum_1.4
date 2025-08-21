"use client";

import { Button } from "@/components/ui/button";
import { Video, Download, Trash2, Check, CheckSquare, Square, DownloadCloud, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserVideosStore } from "@/store/userVideosStore";
import { useEffect, useState } from "react";
import { downloadVideosAsZip } from "@/utils/zipDownloader";
import toast from "react-hot-toast";

export default function VideosPage() {
  const router = useRouter();
  const { 
    videos, 
    removeVideo, 
    clearExpiredVideos,
    selectedVideos,
    toggleVideoSelection,
    selectAllVideos,
    deselectAllVideos,
    removeSelectedVideos,
    getSelectedVideoPaths
  } = useUserVideosStore();
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Nettoyer les vidéos expirées au chargement de la page
  useEffect(() => {
    clearExpiredVideos();
    setMounted(true);
  }, [clearExpiredVideos]);

  // Fonction pour télécharger une vidéo
  const handleDownloadVideo = async (path: string) => {
    try {
      // Vérifier si c'est une URL Supabase ou un chemin local
      const videoUrl = path.includes('supabase.co') || path.includes('supabase.in') || path.startsWith('http')
        ? path
        : path.startsWith('/') ? path : `/${path}`;

      // Récupérer le contenu de la vidéo
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = path.split('/').pop() || 'video.mp4';
      link.download = fileName;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error('Échec du téléchargement. Veuillez réessayer.');
    }
  };

  // Fonction pour télécharger les vidéos sélectionnées en ZIP
  const handleDownloadSelected = async () => {
    try {
      if (selectedVideos.length === 0) {
        toast.error('Veuillez sélectionner au moins une vidéo');
        return;
      }

      setIsDownloading(true);
      toast.loading('Préparation du téléchargement...');
      
      const videosToDownload = getSelectedVideoPaths();
      console.log('Lancement du téléchargement ZIP pour', videosToDownload.length, 'vidéos');
      
      if (videosToDownload.length === 0) {
        throw new Error('Aucune vidéo sélectionnée à télécharger');
      }

      // Vérifier que toutes les vidéos ont des chemins valides
      let hasInvalidPaths = false;
      videosToDownload.forEach((video, index) => {
        if (!video.path) {
          console.error(`Vidéo ${index} a un chemin invalide:`, video);
          hasInvalidPaths = true;
        }
      });

      if (hasInvalidPaths) {
        throw new Error('Certaines vidéos ont des chemins invalides');
      }

      // Procéder au téléchargement
      await downloadVideosAsZip(videosToDownload, 'bluum_videos.zip');
      
      toast.dismiss();
      toast.success(`${videosToDownload.length} vidéos téléchargées avec succès`);
    } catch (error) {
      console.error('Erreur détaillée lors du téléchargement des vidéos:', error);
      toast.dismiss();
      // Vérification de type pour error
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Échec du téléchargement: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour supprimer les vidéos sélectionnées
  const handleRemoveSelected = () => {
    if (selectedVideos.length === 0) {
      toast.error('Veuillez sélectionner au moins une vidéo');
      return;
    }

    const count = selectedVideos.length;
    removeSelectedVideos();
    toast.success(`${count} vidéos supprimées`);
  };

  // Fonction pour basculer entre Sélectionner tout et Désélectionner tout
  const handleToggleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      deselectAllVideos();
    } else {
      selectAllVideos();
    }
  };

  // Fonction pour formater le temps restant
  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const timeRemaining = expiresAt - now;
    
    if (timeRemaining <= 0) {
      return "Expiré";
    }
    
    // Pour les durées courtes (moins de 1h), afficher minutes et secondes
    if (timeRemaining < 60 * 60 * 1000) {
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      if (minutes === 0) {
        return `${seconds}s`;
      }
      
      return `${minutes}m ${seconds}s`;
    }
    
    // Pour les durées plus longues, afficher heures et minutes
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Si le composant n'est pas encore monté, on ne rend rien pour éviter les erreurs d'hydratation
  if (!mounted) {
    return null;
  }

  return (
    <div className="p-6 xl:p-8 w-full h-[calc(100vh-65px)] border-l border-[#27272A]">
      <div className="max-w-[1800px] mx-auto">
        {/* En-tête de la page */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">My Videos</h1>
            <p className="text-gray-400 text-sm">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} available
            </p>
          </div>

          {/* Actions principales */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#27272A] text-white border border-[#3f3f46] rounded-xl hover:bg-[#3f3f46] transition-colors"
            >
              {selectedVideos.length === videos.length ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Select All
                </>
              )}
            </button>

            {selectedVideos.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSelected}
                  disabled={isDownloading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm bg-[#5564ff] text-white rounded-xl hover:bg-[#5564ff]/90 transition-colors ${
                    isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download ({selectedVideos.length})
                    </>
                  )}
                </button>
                <button
                  onClick={handleRemoveSelected}
                  disabled={isDownloading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors ${
                    isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedVideos.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 3xl:grid-cols-12 4xl:grid-cols-14 gap-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group relative bg-[#27272A] rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[9/16] relative bg-[#18181A]">
                  <video
                    src={video.path}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(video.id)}
                        onChange={() => toggleVideoSelection(video.id)}
                        className="h-4 w-4 rounded border-gray-600 text-[#5564ff] focus:ring-[#5564ff] focus:ring-offset-0"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button 
                        onClick={() => handleDownloadVideo(video.path)}
                        className="p-1.5 bg-[#5564ff] hover:bg-[#5564ff]/90 text-white rounded-lg transition-colors"
                        title="Download video"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeVideo(video.id)}
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">Video {video.id}</p>
                  <p className="text-xs text-gray-400 truncate">
                    Expires in {formatTimeRemaining(video.expiresAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="mb-6">
                <Video className="w-16 h-16 text-gray-500 mx-auto" />
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-white">No videos yet</h2>
              <p className="text-gray-400 mb-8">
                Visit the Create page to make your first video
              </p>
              <button
                onClick={() => router.push('/create')}
                className="px-4 py-2 bg-[#5564ff] text-white rounded-xl hover:bg-[#5564ff]/90 transition-colors"
              >
                Create a Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 