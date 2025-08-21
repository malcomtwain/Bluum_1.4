"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getCurrentUser, onAuthStateChanged, initAuth, logout } from '../lib/auth';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initialiser l'authentification et gérer explicitement l'état de chargement
    (async () => {
      try {
        await initAuth();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    // S'abonner aux changements d'état d'authentification (sans toucher à isLoading)
    const unsubscribe = onAuthStateChanged((newUser) => {
      if (mounted) setUser(newUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 