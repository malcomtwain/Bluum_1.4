"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import InvitationPage from './InvitationPage';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Utiliser useEffect pour détecter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth > 768);
    };
    
    // Vérifier la taille initiale
    handleResize();
    
    // Ajouter un écouteur pour les changements de taille
    window.addEventListener('resize', handleResize);
    
    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Si l'authentification est en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher la page d'invitation
  if (!user) {
    return <InvitationPage />;
  }

  // Si l'utilisateur est connecté, afficher le layout normal avec le sidebar
  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}