'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, LayoutDashboard, ShoppingBag, User, LogOut, ShieldCheck } from 'lucide-react';

export default function Perfil() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
    router.refresh();
  };

  const isPunter = !user || user.role === 'PUNTER';
  const isTipsterOrAdmin = user && (user.role === 'TIPSTER' || user.role === 'ADMIN');

  return (
    <div className="flex flex-col flex-1">
      <div className="px-5 pt-4 pb-3 border-b border-white/5">
        <h1 className="text-xl font-extrabold text-white">Perfil</h1>
        <p className="text-xs text-slate-500 mt-0.5">Tu cuenta y configuración</p>
      </div>

      <div className="px-5 pt-6">
        {/* Avatar */}
        <div className="flex flex-col items-center pb-6 border-b border-white/5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-900/30 mb-3">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h2 className="text-lg font-extrabold text-white">{user?.name || 'Apostador Invitado'}</h2>
          {user?.username && (
            <p className="text-xs text-slate-500 mt-0.5">@{user.username}</p>
          )}
          {user?.email && (
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {user?.role || 'APOSTADOR'}
            </span>
          </div>
        </div>

        {/* Reposiciones balance */}
        {user && user.role === 'PUNTER' && (
          <div className="mt-4 mb-2 p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Reposiciones Disponibles</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.freeBetsCount && user.freeBetsCount > 0 
                  ? 'Puedes usar tus reposiciones para adquirir cualquier pick gratis.' 
                  : 'Si compras un pick y resulta perdido, recibirás una reposición.'}
              </p>
            </div>
            <span className={`text-xl font-black shrink-0 ${user.freeBetsCount && user.freeBetsCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
              {user.freeBetsCount || 0} 🎁
            </span>
          </div>
        )}

        {/* Menu */}
        <div className="pt-4 space-y-2">
          {isPunter && (
            <Link href="/mis-picks" className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/20 transition-all press">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Mis Picks</p>
                <p className="text-xs text-slate-500">Ver pronósticos comprados</p>
              </div>
              <span className="text-slate-600 text-lg">›</span>
            </Link>
          )}

          {isTipsterOrAdmin && (
            <Link href="/dashboard" className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/20 transition-all press">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Panel Tipster</p>
                <p className="text-xs text-slate-500">Gestiona tus picks y ventas</p>
              </div>
              <span className="text-slate-600 text-lg">›</span>
            </Link>
          )}

          {isPunter && (
            <Link href="/login" className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/20 transition-all press">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <LogIn className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">¿Eres Tipster?</p>
                <p className="text-xs text-slate-500">Inicia sesión con tu cuenta</p>
              </div>
              <span className="text-slate-600 text-lg">›</span>
            </Link>
          )}

          {isTipsterOrAdmin && (
            <button onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 transition-all press">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-rose-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-rose-400">Cerrar Sesión</p>
                <p className="text-xs text-slate-500">Volver como apostador</p>
              </div>
            </button>
          )}
        </div>

        {isPunter && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Tus compras están guardadas en este dispositivo. Si cambias de navegador, inicia sesión con el mismo usuario para recuperarlas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
