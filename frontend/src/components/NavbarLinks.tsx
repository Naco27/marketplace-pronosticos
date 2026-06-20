'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, User as UserIcon, Zap } from 'lucide-react';

export default function NavbarLinks() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      {/* Explore link - hidden on very small screens */}
      <Link
        href="/"
        className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
      >
        <Zap className="h-3.5 w-3.5 text-emerald-400" />
        Picks
      </Link>

      {user ? (
        <div className="flex items-center gap-2">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Panel</span>
          </Link>

          {/* User pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 text-slate-950 font-bold text-xs shadow">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                firstName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-bold text-white">{firstName}</span>
              <span className="text-[9px] text-emerald-400 font-semibold tracking-widest uppercase">{user.role}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="ml-1 flex items-center justify-center h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            Ingreso Tipster
          </Link>
        </div>
      )}
    </nav>
  );
}
