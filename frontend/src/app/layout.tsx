import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientInit from "@/components/ClientInit";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "BetMarket — Picks Premium",
  description: "Compra y vende pronósticos deportivos verificados. Picks fijos con análisis completo.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BetMarket" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050810",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-[#050810] text-slate-100 overflow-x-hidden`}>
        <ClientInit />

        {/* App Shell: header + content + bottom nav */}
        <div className="flex flex-col min-h-full max-w-lg mx-auto relative">
          {/* Top status bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between px-5 h-14 bg-[#050810]/90 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <span className="text-slate-950 font-black text-xs">B</span>
              </div>
              <span className="font-extrabold text-white tracking-tight">BetMarket</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
          </header>

          {/* Page content — padded bottom for nav */}
          <main className="flex-1 flex flex-col pb-20">
            {children}
          </main>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
