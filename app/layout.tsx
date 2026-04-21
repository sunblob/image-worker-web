import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { MobileNav } from '@/components/MobileNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = { title: 'Image Worker' }

// Runs before React hydrates — reads stored theme and applies .dark on <html>
// to avoid a flash of wrong-theme content on first paint.
const themeScript = `
(function(){try{
  var t = localStorage.getItem('theme') || 'system';
  var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen bg-background text-foreground antialiased">
        <Sidebar />
        <main className="relative flex-1 min-w-0 p-4 md:p-8 pb-20 md:pb-8">
          {/* Mobile-only theme toggle — aligned with the page title */}
          <div className="md:hidden absolute top-4 right-4 z-10 rounded-md border border-border bg-card shadow-sm">
            <ThemeToggle compact />
          </div>
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  )
}
