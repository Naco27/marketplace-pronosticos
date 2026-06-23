'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePredictionStore } from '@/store/usePredictionStore';
import { ShoppingBag, Flame, Unlock, Clock, ChevronRight, CheckCircle } from 'lucide-react';

const RESULT_CONFIG = {
  WON:  { emoji: '🏆', badge: '🏆 GANADA',  bannerLabel: '¡Pick GANADOR!',  bannerSub: 'El tipster marcó esta apuesta como ganada.',  bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  LOST: { emoji: '❌', badge: '❌ PERDIDA', bannerLabel: 'Pick perdido',     bannerSub: 'El tipster marcó esta apuesta como perdida.', bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    icon: 'bg-rose-500/20' },
  VOID: { emoji: '↩️', badge: '↩️ ANULADA', bannerLabel: 'Apuesta anulada', bannerSub: 'Esta apuesta fue anulada por el tipster.',    bg: 'bg-slate-800/50',  border: 'border-slate-700',      text: 'text-slate-400',   icon: 'bg-slate-700' },
} as const;

export default function MisPicks() {
  const { accessToken } = useAuthStore();
  const { purchasedPicks, purchasedLoading, fetchPurchasedPicks } = usePredictionStore();

  useEffect(() => {
    if (accessToken) {
      fetchPurchasedPicks(accessToken);
    }
  }, [accessToken, fetchPurchasedPicks]);

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/5">
        <h1 className="text-xl font-extrabold text-white">Mis Picks</h1>
        <p className="text-xs text-slate-500 mt-0.5">Tus pronósticos desbloqueados</p>
      </div>

      <div className="flex-1 px-4 pt-4 pb-4">
        {purchasedLoading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-800/30 animate-pulse" />
            ))}
          </div>
        )}

        {!purchasedLoading && purchasedPicks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
              <ShoppingBag className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-slate-400 font-semibold">No tienes picks aún</p>
            <p className="text-slate-600 text-sm mt-1">Explora el marketplace y compra un pronóstico</p>
          </div>
        )}

        {!purchasedLoading && purchasedPicks.map((p) => {
          const pick = p.prediction;
          const expirationDate = pick.availableUntil ? new Date(pick.availableUntil) : new Date(pick.eventDate);
          const isLive = (pick.isLive || expirationDate <= new Date()) && !pick.isCompleted;
          const rc = pick.isCompleted && pick.result && pick.result in RESULT_CONFIG
            ? RESULT_CONFIG[pick.result as keyof typeof RESULT_CONFIG]
            : null;

          return (
            <div key={p.id} className={`rounded-2xl border overflow-hidden mb-3 ${rc ? `${rc.border} bg-slate-900/70` : 'border-white/5 bg-slate-900/70'}`}>
              {/* Header strip */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{pick.sport}</span>
                  {pick.isFixed && (
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full">📌 FIJA</span>
                  )}
                  <span className="text-xs text-slate-500">{pick.league}</span>
                </div>
                {rc ? (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                    {rc.badge}
                  </span>
                ) : isLive ? (
                  <span className="badge-live flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                    <Flame className="h-3 w-3" /> EN JUEGO
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(pick.eventDate).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>

              {/* Result banner — shown when resolved */}
              {rc && (
                <div className={`mx-4 mt-3 rounded-xl p-3 flex items-center gap-3 ${rc.bg} border ${rc.border}`}>
                  <div className={`h-11 w-11 rounded-full shrink-0 ${rc.icon} flex items-center justify-center text-2xl`}>
                    {rc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-extrabold uppercase tracking-wider ${rc.text}`}>{rc.bannerLabel}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{rc.bannerSub}</p>
                  </div>
                  <CheckCircle className={`h-5 w-5 shrink-0 ${rc.text}`} />
                </div>
              )}

              {/* Pick content */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Pick Desbloqueado</span>
                  <div className="flex-1" />
                  <span className="text-xs text-slate-500">@{pick.odds?.toFixed(2)} · Stake {pick.stake}/10</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{pick.description}</p>

                {pick.argumentation && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] text-cyan-400 font-bold uppercase mb-1">🧠 Argumentación:</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{pick.argumentation}</p>
                  </div>
                )}

                {pick.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pick.imageUrl} alt="Apuesta" className="rounded-xl mt-2 w-full object-cover max-h-36 border border-slate-700" />
                )}

                {pick.betLink && (
                  <a href={pick.betLink} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300">
                    🔗 Ver en casa de apuestas <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="px-4 pb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Tipster: <span className="text-white font-semibold">{pick.tipster?.name}</span></span>
                <span>{new Date(p.createdAt).toLocaleDateString('es')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
