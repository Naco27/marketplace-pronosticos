'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Home, ShoppingBag, LayoutDashboard, LogIn, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isPunter = !user || user.role === 'PUNTER';
  const isTipsterOrAdmin = user && (user.role === 'TIPSTER' || user.role === 'ADMIN');

  const punterTabs = [
    { href: '/', icon: Home, label: 'Picks' },
    { href: '/mis-picks', icon: ShoppingBag, label: 'Mis Picks' },
    { href: '/perfil', icon: User, label: 'Perfil' },
  ];

  const tipsterTabs = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
    { href: '/perfil', icon: User, label: 'Perfil' },
  ];

  const tabs = isTipsterOrAdmin ? tipsterTabs : punterTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
                isActive ? 'nav-active' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
        
        {/* Login/Logout button for non-tipster */}
        {!user || user.role === 'PUNTER' ? (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-slate-500 hover:text-slate-300 transition-all duration-200"
          >
            <LogIn className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-[10px] font-semibold tracking-wide text-slate-500">Tipster</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
