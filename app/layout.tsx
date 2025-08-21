import "./globals.css";
import "./theme-overrides.css";
import { Inter, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import AuthLayout from "../components/AuthLayout";
import { VideoCleanup } from "../components/VideoCleanup";
import { Toaster as ReactHotToastToaster } from 'react-hot-toast';
import { AuthProvider } from "../contexts/AuthContext";
import { SupabaseSync } from "../components/SupabaseSync";

const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito({ 
  subsets: ["latin"],
  weight: ["600"],
  variable: '--font-nunito',
});

export const metadata = {
  title: 'Bluum - Video Generator',
  description: 'Create engaging videos with templates, media, and hooks',
  icons: {
    icon: '/BluumFavicon.png',
    shortcut: '/BluumFavicon.png',
    apple: '/BluumFavicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
        <html lang="en" suppressHydrationWarning className={`dark ${nunito.variable}`}>
          <head>
            <script dangerouslySetInnerHTML={{ __html: `
              // Force dark mode
              document.documentElement.classList.add('dark');
              document.body.style.backgroundColor = '#0a0a0c';
            `}} />
          </head>
          <body className={`${inter.className} bg-[#0a0a0c]`} suppressHydrationWarning>
            <div className="min-h-screen bg-[#f3f4ee] dark:bg-[#0a0a0c] flex">
              <main className="flex-1">
                <AuthLayout>
                  {children}
                </AuthLayout>
              </main>
            </div>
            <Toaster position="top-center" />
            <VideoCleanup />
            <ReactHotToastToaster position="bottom-center" />
            <SupabaseSync />
          </body>
        </html>
    </AuthProvider>
  );
} 