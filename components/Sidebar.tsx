"use client";

import * as React from "react";
import { VideoIcon, MusicIcon, PlusIcon, CreditCardIcon, SparklesIcon, TextIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUserPlanStore } from "@/store/userPlanStore";
import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";

// Fonction pour formatter les nombres avec des virgules comme séparateurs de milliers
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const email = user?.email || '';
  
  // Utilisez le store pour les informations du plan
  const { videoCredits, setPlan } = useUserPlanStore();

  React.useEffect(() => {
    setMounted(true);
    
    // Mettre à jour le plan quand l'email change
    setPlan(email);
  }, [email, setPlan]);

  if (!mounted) {
    return null;
  }

  return (
    <aside className="w-[70px] xl:w-[260px] bg-[#fafafa] dark:bg-[#0a0a0c] border-r border-[#27272A] flex flex-col font-[-apple-system,BlinkMacSystemFont] transition-all duration-300 z-30 h-full">
      <div className="p-3 xl:p-5 flex flex-col items-center h-full">
        <div className="w-full flex justify-start pt-4 mb-10 xl:pt-4 xl:mb-12">
          <div className="hidden xl:block xl:pl-2">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src="/BluumLogo.png"
                alt="Bluum Logo"
                width={40}
                height={40}
                className="object-contain dark:hidden"
              />
              <img
                src="/BluumLogoDarkTheme.png"
                alt="Bluum Logo Dark"
                width={40}
                height={40}
                className="object-contain hidden dark:block"
              />
              <span 
                id="bluum-logo-title"
                className="text-xl font-medium !text-[#fafafa] [background-image:none]"
              >
              </span>
            </Link>
          </div>
          <div className="xl:hidden flex justify-center w-full">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img
                src="/BluumLogo.png"
                alt="Bluum Logo"
                width={40}
                height={40}
                className="object-contain dark:hidden"
              />
              <img
                src="/BluumLogoDarkTheme.png"
                alt="Bluum Logo Dark"
                width={40}
                height={40}
                className="object-contain hidden dark:block"
              />
            </Link>
          </div>
        </div>
        
        <nav className="space-y-6 w-full flex-1">
          <div>
            <Button 
              variant="ghost"
              onClick={() => router.push("/create")}
              className={`w-full flex items-center justify-center text-lg font-semibold group transition-all duration-300 rounded-xl relative overflow-hidden text-[#fafafa] hover:text-[#fafafa] dark:text-[#0a0a0c] dark:hover:text-[#0a0a0c] ${
                pathname === "/create" 
                  ? "hover:opacity-90" 
                  : "hover:opacity-90"
              } h-10 bg-[#5564ff] hover:bg-[#5564ff]/90 dark:bg-[#fafafa] dark:hover:bg-[#fafafa]/90 z-10 pointer-events-auto`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <PlusIcon className="h-5 w-5 scale-125 flex-shrink-0" />
                <span className="hidden xl:inline">Create</span>
              </div>
            </Button>
          </div>
          <div className="space-y-1.5">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/videos")}
              className={`w-full text-base rounded-xl ${
                pathname === "/videos" 
                  ? "bg-[#fafafa] dark:bg-[#18191C] text-black dark:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#18191C] hover:text-black dark:hover:text-[#fafafa] border-2 border-[#DADBD2] dark:border-[#27272A]" 
                  : "text-black dark:text-[#fafafa] hover:text-black dark:hover:text-[#fafafa] hover:bg-[#F5F5F5] dark:hover:bg-[#18191C] border-2 border-transparent dark:hover:border-[#27272A]"
              } h-10 flex items-center justify-center xl:justify-start z-10 pointer-events-auto`}
            >
              <div className="flex items-center gap-3 pointer-events-auto">
                <VideoIcon className="h-5 w-5 scale-125 flex-shrink-0" />
                <span className={`hidden xl:inline ${pathname === "/videos" ? "font-medium" : ""}`}>
                  My Clips
                </span>
              </div>
            </Button>
            
            {/* Onglet Music Library accessible à tous */}
            <Button 
              variant="ghost" 
              onClick={() => router.push("/music")}
              className={`w-full text-base rounded-xl ${
                pathname === "/music" 
                  ? "bg-[#fafafa] dark:bg-[#18191C] text-black dark:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#18191C] hover:text-black dark:hover:text-[#fafafa] border-2 border-[#DADBD2] dark:border-[#27272A]" 
                  : "text-black dark:text-[#fafafa] hover:text-black dark:hover:text-[#fafafa] hover:bg-[#F5F5F5] dark:hover:bg-[#18191C] border-2 border-transparent dark:hover:border-[#27272A]"
              } h-10 flex items-center justify-center xl:justify-start z-10 pointer-events-auto`}
            >
              <div className="flex items-center gap-3 pointer-events-auto">
                <MusicIcon className="h-5 w-5 scale-125 flex-shrink-0" />
                <span className={`hidden xl:inline ${pathname === "/music" ? "font-medium" : ""}`}>
                  Music Library
                </span>
              </div>
            </Button>

            {/* Onglet Videos Library */}
            <Button 
              variant="ghost" 
              onClick={() => router.push("/videos-library")}
              className={`w-full text-base rounded-xl ${
                pathname === "/videos-library" 
                  ? "bg-[#fafafa] dark:bg-[#18191C] text-black dark:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#18191C] hover:text-black dark:hover:text-[#fafafa] border-2 border-[#DADBD2] dark:border-[#27272A]" 
                  : "text-black dark:text-[#fafafa] hover:text-black dark:hover:text-[#fafafa] hover:bg-[#F5F5F5] dark:hover:bg-[#18191C] border-2 border-transparent dark:hover:border-[#27272A]"
              } h-10 flex items-center justify-center xl:justify-start z-10 pointer-events-auto`}
            >
              <div className="flex items-center gap-3 pointer-events-auto">
                <VideoIcon className="h-5 w-5 scale-125 flex-shrink-0" />
                <span className={`hidden xl:inline ${pathname === "/videos-library" ? "font-medium" : ""}`}>
                  Videos Library
                </span>
              </div>
            </Button>

          </div>
        </nav>

        {/* Bouton Pricing */}
        <div className="w-full mt-auto pb-4">
          <Button 
            variant="ghost"
            onClick={() => router.push("/pricing")}
            className="w-full flex items-center justify-center text-base font-medium group transition-all duration-300 rounded-xl relative overflow-hidden text-[#0a0a0c] h-10 bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] hover:opacity-90 z-10 pointer-events-auto shadow-lg"
          >
            <div className="flex items-center gap-3 relative z-10">
              <SparklesIcon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden xl:inline">Pricing</span>
            </div>
          </Button>
        </div>
      </div>
    </aside>
  );
}; 