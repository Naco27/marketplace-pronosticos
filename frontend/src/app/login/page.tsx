'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';
import { getAPI_URL } from '@/utils/config';

const API_URL = getAPI_URL();

export default function Login() {
  const { login, setTokens, error, loading } = useAuthStore();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    const ok = await login({ code });
    if (ok) {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/guest`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTokens(data.accessToken, data.refreshToken, data.user);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Guest login failed:', err);
      alert('Error al ingresar como apostador.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-5 pt-8 pb-6 justify-center">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/30">
          <ShieldCheck className="h-7 w-7 text-slate-950" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Ingreso Tipster</h1>
        <p className="text-sm text-slate-500 mt-1">Ingresa el código secreto para acceder al panel de Tipster</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400 text-center">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Código de Acceso Tipster</label>
          <input type="text" required value={code} onChange={e => setCode(e.target.value)}
            placeholder="Introduce el código secreto..."
            className="mt-1.5 w-full rounded-xl bg-slate-900/90 border border-white/5 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 press">
          {loading ? 'Ingresando...' : <>Ingresar a Panel <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#050810] px-2 text-slate-500 font-bold">¿Eres Apostador?</span>
        </div>
      </div>

      {/* Direct Guest Login Button */}
      <button onClick={handleGuestLogin} disabled={guestLoading}
        className="w-full py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white hover:bg-slate-900 font-bold text-sm transition flex items-center justify-center gap-2.5 press">
        <User className="h-4 w-4 text-emerald-400" />
        {guestLoading ? 'Ingresando...' : 'Ingresar Directo (Sin Registro)'}
      </button>
    </div>
  );
}
