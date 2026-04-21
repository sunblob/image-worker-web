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
        <main className="flex-1 min-w-0 p-4 pt-16 md:p-8 md:pt-8 pb-20 md:pb-8">{children}</main>

        {/* Mobile-only floating theme toggle — top right */}
        <div className="md:hidden fixed top-3 right-3 z-50 rounded-md border border-border bg-card shadow-sm">
          <ThemeToggle compact />
        </div>

        <MobileNav />
      </body>
    </html>
  )
}
