'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function VideoDisabledBanner() {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Détecter si on est sur bluum.pro
    const isProd = window.location.hostname === 'bluum.pro' || 
                   window.location.hostname.includes('vercel.app');
    setIsProduction(isProd);
  }, []);

  if (!isProduction) return null;

  return (
    <div className="bg-yellow-500 text-black p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <p className="font-bold">Fonctionnalités vidéo temporairement désactivées</p>
            <p className="text-sm">
              Le traitement vidéo n'est pas disponible sur bluum.pro (limitation Vercel).
              Utilisez la version locale ou attendez la migration vers un nouveau serveur.
            </p>
          </div>
        </div>
        <a 
          href="https://github.com/votre-repo/bluum#local-setup"
          className="bg-black text-yellow-500 px-4 py-2 rounded hover:bg-gray-800"
        >
          Installer en local
        </a>
      </div>
    </div>
  );
}