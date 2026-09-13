import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DogEar",
  description: "Your personal library catalog",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      {/* Restore color theme before first paint to avoid flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var p = localStorage.getItem('dogear-theme-preset');
            if (p && p !== 'default' && p !== 'custom') {
              document.documentElement.classList.add('theme-' + p);
            }
          } catch(e) {}
        `}} />
      </head>
      <body className={cn("antialiased bg-background text-foreground", inter.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <MobileNav />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
