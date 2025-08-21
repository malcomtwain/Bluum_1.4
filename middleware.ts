// MIDDLEWARE TEMPORAIREMENT DÉSACTIVÉ POUR PERMETTRE LE DÉPLOIEMENT
// Une fois le site en production, nous pourrons réactiver progressivement
// les fonctionnalités du middleware de manière compatible avec Edge Functions

/*
import { NextRequest, NextResponse } from "next/server";

// Liste des routes publiques
const publicPaths = [
  "/auth",
  "/auth/",
  "/sign-in",
  "/sign-up",
  "/api/webhook",
  "/favicon.ico",
  "/BluumLogo.png",
  "/BluumFavicon.png",
  "/_next",
  "/api"
];

// Fonction pour vérifier si un chemin est public
function isPublicPath(path: string): boolean {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`)
  );
}

// Middleware pour vérifier si l'utilisateur est authentifié
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Si la route est publique, laisser passer sans vérification
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Vérifier si l'utilisateur a un cookie d'authentification
  // (on cherche le cookie __session qui est généralement utilisé par Clerk)
  const hasAuthCookie = req.cookies.has('__session');
  
  // Si l'utilisateur n'est pas authentifié, le rediriger vers la page de connexion
  if (!hasAuthCookie) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Si l'utilisateur est authentifié, le laisser passer
  return NextResponse.next();
}

// Configuration pour spécifier quels chemins doivent passer par le middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.+\\..+).*)",
    "/"
  ]
};
*/

import { NextRequest, NextResponse } from "next/server";

// Middleware minimaliste qui ne fait que laisser passer toutes les requêtes
// mais qui maintient la structure que Next.js attend
export function middleware(req: NextRequest) {
  try {
    // Simplement laisser passer les requêtes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Retourner une réponse normale en cas d'erreur pour éviter une erreur 500
    return NextResponse.next();
  }
}

// Configuration pour spécifier quels chemins doivent passer par le middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 