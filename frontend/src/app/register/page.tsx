'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const { register, error, loading } = useAuthStore();
  const router = useRouter();

  const [mode, setMode] = useState<'TIPSTER' | 'PUNTER'>('PUNTER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const ok = await register({
      role: mode,
      name,
      email: mode === 'TIPSTER' ? email : undefined,
      password: mode === 'TIPSTER' ? password : undefined,
      username: mode === 'PUNTER' ? username : undefined,
    });
    if (ok) {
      router.push(mode === 'TIPSTER' ? '/dashboard' : '/');
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col flex-1 px-5 pt-8 pb-6">
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/30">
          <UserPlus className="h-7 w-7 text-slate-950" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Crear Cuenta</h1>
        <p className="text-sm text-slate-500 mt-1">Elige tu tipo de cuenta</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900/60 border border-white/5 rounded-xl mb-6">
        {(['PUNTER', 'TIPSTER'] as const).map((r) => (
          <button key={r} onClick={() => setMode(r)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === r ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}>
            {r === 'TIPSTER' ? '📊 Tipster' : '🎯 Apostador'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400 text-center">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder={mode === 'PUNTER' ? 'Tu apodo' : 'Tu nombre completo'}
            className="mt-1.5 w-full rounded-xl bg-slate-900 border border-white/5 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
        </div>

        {mode === 'PUNTER' ? (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de usuario</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
              placeholder="carlosapuesta123"
              className="mt-1.5 w-full rounded-xl bg-slate-900 border border-white/5 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
            <p className="text-xs text-slate-500 mt-2">Recuérdalo para recuperar tus compras.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-white/5 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-white/5 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm transition hover:opacity-90 disabled:opacity-50 press">
          {loading ? 'Creando...' : 'Registrarme'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-4">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
