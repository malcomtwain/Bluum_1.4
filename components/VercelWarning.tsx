'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function VercelWarning() {
  const [isVercel, setIsVercel] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Détecter si nous sommes sur Vercel
    const hostname = window.location.hostname;
    const isVercelDomain = hostname.includes('vercel.app') || hostname === 'bluum.pro';
    setIsVercel(isVercelDomain);
    
    // Vérifier si l'utilisateur a déjà dismissé l'avertissement
    const wasDismissed = localStorage.getItem('vercel-warning-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('vercel-warning-dismissed', 'true');
  };

  if (!isVercel || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start">
        <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">
            Limitation de Traitement Vidéo
          </h3>
          <p className="text-sm text-yellow-800 mb-3">
            Le traitement vidéo n'est pas disponible sur Vercel. 
            Les fonctionnalités de création vidéo ne fonctionneront pas.
          </p>
          <div className="flex items-center justify-between">
            <a
              href="/video-processing-info"
              className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              En savoir plus →
            </a>
            <button
              onClick={handleDismiss}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}