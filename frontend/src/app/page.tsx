'use client';

import { useEffect, useRef, useState } from 'react';
import { usePredictionStore, Prediction } from '@/store/usePredictionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, TrendingUp, Star, Clock,
  Lock, Unlock, CheckCircle, Flame, ChevronRight,
  Upload, X, ZoomIn, ExternalLink
} from 'lucide-react';
import { getAPI_URL, getBaseUrl } from '@/utils/config';

const API_URL = getAPI_URL();

function TimeUntil({ date, onExpired }: { date: string; onExpired?: () => void }) {
  const [label, setLabel] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const calc = () => {
      const diff = new Date(date).getTime() - Date.now();
      if (diff <= 0) {
        setLabel('En curso');
        if (!expired) { setExpired(true); onExpired?.(); }
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (h > 0) {
        setLabel(`${h}h ${m}m`);
      } else if (m > 0) {
        setLabel(`${m}m ${s}s`);
      } else {
        setLabel(`${s}s`);
      }
    };
    calc();
    const id = setInterval(calc, 1_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  return <span>{label}</span>;
}

type PayMethod = 'YAPE' | 'PLIN' | 'BINANCE' | 'FREE_BET';

// ── Yape Modal ────────────────────────────────────────────
function YapeModal({ prediction, purchaseId, accessToken, method, onSuccess, onClose }: {
  prediction: Prediction; purchaseId: string; accessToken: string | null;
  method: PayMethod; onSuccess: () => void; onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [refCode, setRefCode] = useState('');

  const isYape = method === 'YAPE';
  const isPlin = method === 'PLIN';
  const isBinance = method === 'BINANCE';

  let headerBg = 'bg-[#611F8C]';
  let methodLabel = 'Yape';
  let methodLogo = 'Y';
  let actionText = 'yapear';
  let recipientName = 'Brajhan Jhoel Sandoval Duran';
  let recipientDetail = '912966742';
  let qrPath = '/yape-qr.png';

  if (isPlin) {
    headerBg = 'bg-[#00a896]';
    methodLabel = 'Plin';
    methodLogo = 'P';
    actionText = 'plinear';
  } else if (isBinance) {
    headerBg = 'bg-[#F0B90B]';
    methodLabel = 'Binance Pay';
    methodLogo = 'B';
    actionText = 'transferir a';
    recipientName = 'Sandoval Duran';
    recipientDetail = 'Pay ID: 258963147';
    qrPath = '/binance-qr.png';
  }

  const headerText = isBinance ? 'text-slate-950' : 'text-white';
  const subHeaderText = isBinance ? 'text-slate-800' : 'text-purple-200';

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleYape = async () => {
    if (!screenshotFile) {
      alert('Por favor sube la captura de pantalla de tu pago.');
      return;
    }
    setLoading(true);
    
    // 1. Upload screenshot image to backend
    let finalScreenshotUrl = '';
    const formData = new FormData();
    formData.append('image', screenshotFile);
    try {
      const uploadRes = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        finalScreenshotUrl = uploadData.imageUrl.startsWith('http') ? uploadData.imageUrl : `${getBaseUrl()}${uploadData.imageUrl}`;
      } else {
        alert('Error al subir la captura de pago: ' + (uploadData.error || 'Error desconocido'));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Screenshot upload error:', err);
      alert('Error de conexión al subir la captura de pago.');
      setLoading(false);
      return;
    }

    // 2. Submit proof
    const store = usePredictionStore.getState();
    const ref = refCode || `${methodLabel.toUpperCase()}-${Math.floor(10_000_000 + Math.random() * 90_000_000)}`;
    try {
      await store.submitProof(purchaseId, ref, finalScreenshotUrl, accessToken);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`${headerBg} ${headerText} px-5 pt-5 pb-4 shrink-0`}>
          <div className="mx-auto mb-4 h-1 w-10 bg-black/10 rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`h-9 w-9 rounded-full bg-white flex items-center justify-center font-black text-lg ${isYape ? 'text-[#611F8C]' : isPlin ? 'text-[#00a896]' : 'text-[#F0B90B]'}`}>
                {methodLogo}
              </div>
              <span className="font-bold text-base">Pagar con {methodLabel}</span>
            </div>
            <button onClick={onClose} className="hover:opacity-80 text-xl">✕</button>
          </div>
          <p className={`text-xs uppercase tracking-widest font-semibold ${subHeaderText}`}>Vas a {actionText}</p>
          <p className="text-lg font-extrabold mt-0.5">{recipientName}</p>
          <p className="text-sm font-bold">{recipientDetail}</p>
        </div>

        {/* Content (Scrollable) */}
        <div className="px-5 pt-5 pb-10 space-y-5 overflow-y-auto flex-1">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Monto a enviar</p>
            <p className="text-3xl font-black text-gray-900 mt-1">S/. {prediction.price.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">{prediction.sport} — {prediction.league} · Cuota @{prediction.odds.toFixed(2)}</p>
          </div>

          {/* QR code and download */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrPath} alt={`${methodLabel} QR`} className="w-40 h-auto object-contain rounded-lg shadow-sm animate-fade-in" />
            <p className="text-[10px] text-gray-500 mt-2 font-semibold text-center">Escanea el código QR desde tu app {methodLabel}</p>
            <a href={qrPath} download={`${methodLabel.toLowerCase()}-qr.png`} 
              className={`mt-3 flex items-center justify-center gap-2 text-xs px-4 py-2 rounded-xl font-bold transition w-full shadow-sm ${
                isYape ? 'bg-[#611F8C] hover:bg-[#521a75] text-white' : isPlin ? 'bg-[#00a896] hover:bg-[#008f7f] text-white' : 'bg-[#F0B90B] hover:bg-[#d6a40a] text-slate-950'
              }`}>
              <Upload className="h-3.5 w-3.5 rotate-180" />
              Descargar código QR
            </a>
          </div>

          {/* Upload payment proof */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Adjuntar captura de pago *</label>
            <div className={`relative border-2 border-dashed rounded-2xl overflow-hidden bg-gray-50 min-h-[110px] flex items-center justify-center transition ${
              isYape ? 'border-gray-300 hover:border-[#611F8C]' : isPlin ? 'border-gray-300 hover:border-[#00a896]' : 'border-gray-300 hover:border-[#F0B90B]'
            }`}>
              {screenshotPreview ? (
                <div className="relative w-full p-2 flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview} alt="Captura de Pago" className="max-h-36 rounded-lg object-contain border border-gray-200" />
                  <button type="button" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                    className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="screenshot-upload" className="flex flex-col items-center justify-center gap-1.5 cursor-pointer p-4 text-center w-full h-full">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-xs text-gray-600 font-bold">Subir captura de pantalla</span>
                  <span className="text-[10px] text-gray-400">Imagen JPEG o PNG</span>
                  <input id="screenshot-upload" type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
                </label>
              )}
            </div>
          </div>

          {/* Optional Ref code */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Código de referencia / hash transacción (Opcional)</label>
            <input type="text" placeholder="Ej: 19842859" value={refCode} onChange={(e) => setRefCode(e.target.value)}
              className={`w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800 focus:outline-none transition ${
                isYape ? 'focus:border-[#611F8C]' : isPlin ? 'focus:border-[#00a896]' : 'focus:border-[#F0B90B]'
              }`} />
          </div>

          <button onClick={handleYape} disabled={loading || !screenshotFile}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${
              isYape 
                ? 'bg-[#611F8C] hover:bg-[#7a2db0] text-white shadow-purple-900/30' 
                : isPlin 
                  ? 'bg-[#00a896] hover:bg-[#00cbb5] text-white shadow-teal-900/30'
                  : 'bg-[#F0B90B] hover:bg-[#d6a40a] text-slate-950 shadow-yellow-900/20'
            }`}>
            {loading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : `Confirmar Pago por ${methodLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checkout Modal ────────────────────────────────────────
const METHODS: { id: PayMethod; label: string; icon: string }[] = [
  { id: 'YAPE', label: 'Yape', icon: '💜' },
  { id: 'PLIN', label: 'Plin', icon: '🟢' },
  { id: 'BINANCE', label: 'Binance', icon: '🟡' },
];

function CheckoutModal({ prediction, onClose }: { prediction: Prediction; onClose: () => void }) {
  const { accessToken, user } = useAuthStore();
  const [method, setMethod] = useState<PayMethod>(
    user && (user as any).freeBetsCount > 0 ? 'FREE_BET' : 'YAPE'
  );
  const [step, setStep] = useState<'METHOD' | 'YAPE' | 'SUCCESS'>('METHOD');
  const [purchaseId, setPurchaseId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    setLoading(true);
    const store = usePredictionStore.getState();
    try {
      const result = await store.checkout(prediction.id, method, accessToken);
      setPurchaseId(result.purchaseId || '');
      if (method === 'YAPE' || method === 'PLIN' || method === 'BINANCE') {
        setStep('YAPE');
      } else if (method === 'FREE_BET') {
        // Decrement local freeBetsCount immediately for a fluid experience
        const authStore = useAuthStore.getState();
        if (authStore.user && (authStore.user as any).freeBetsCount !== undefined) {
          authStore.setTokens(
            authStore.accessToken!,
            authStore.refreshToken!,
            {
              ...authStore.user,
              freeBetsCount: Math.max(0, (authStore.user as any).freeBetsCount - 1),
            }
          );
        }
        setStep('SUCCESS');
      } else {
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          setStep('SUCCESS');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error al iniciar el pago.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'YAPE') {
    return <YapeModal prediction={prediction} purchaseId={purchaseId} accessToken={accessToken} method={method}
      onSuccess={() => setStep('SUCCESS')} onClose={onClose} />;
  }

  if (step === 'SUCCESS') {
    const isManual = method === 'YAPE' || method === 'PLIN' || method === 'BINANCE';
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          {isManual ? (
            <>
              <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold text-white">¡Comprobante Enviado!</h3>
              <p className="text-sm text-slate-400 mt-2">
                Tu pago está siendo verificado. Una vez que el tipster valide el comprobante, el pick se desbloqueará automáticamente.
              </p>
              <button onClick={() => { usePredictionStore.getState().fetchPredictions(); onClose(); }}
                className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold transition hover:opacity-90">
                Entendido 👍
              </button>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white">¡Pick Desbloqueado!</h3>
              <p className="text-sm text-slate-400 mt-2">Tu análisis completo ya está disponible en Mis Picks.</p>
              <button onClick={() => { usePredictionStore.getState().fetchPredictions(); onClose(); }}
                className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold transition hover:opacity-90">
                Ver Pick 🔓
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border-t border-white/5 rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-10">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-700" />
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-lg font-extrabold text-white">Adquirir Pick</h3>
              <p className="text-xs text-slate-400 mt-0.5">{prediction.sport} · {prediction.league} · @{prediction.odds.toFixed(2)}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
          </div>

          <div className="flex justify-between items-center bg-slate-800/60 rounded-xl px-4 py-3 mb-5">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-2xl font-black text-white">
              {method === 'FREE_BET' ? 'GRATIS (Reposición)' : `S/. ${prediction.price.toFixed(2)}`}
            </span>
          </div>

          {/* Bloque destacado para usar Reposición si tiene saldo */}
          {user && (user as any).freeBetsCount > 0 && (
            <button
              onClick={() => setMethod('FREE_BET')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border mb-4 transition-all press text-left ${
                method === 'FREE_BET'
                  ? 'border-emerald-500 bg-emerald-500/15 text-white scale-[1.01]'
                  : 'border-emerald-500/25 bg-emerald-500/5 text-slate-300 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Usar Reposición de Apuesta</p>
                  <p className="text-[11px] text-slate-400">Tienes {(user as any).freeBetsCount} disponible(s)</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                method === 'FREE_BET' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
              }`}>
                {method === 'FREE_BET' && <span className="h-2 w-2 rounded-full bg-slate-950" />}
              </div>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 mb-5">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all press ${
                  method === m.id ? 'border-emerald-500 bg-emerald-500/10 scale-[1.03]' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}>
                <span className="text-xl">{m.icon}</span>
                <span className="text-[10px] font-bold text-white">{m.label}</span>
              </button>
            ))}
          </div>

          <button onClick={handleProceed} disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm transition hover:opacity-90 disabled:opacity-60 press">
            {loading ? 'Procesando...' : method === 'FREE_BET' ? 'Confirmar Reposición Gratuita 🎁' : `Pagar con ${METHODS.find(m => m.id === method)?.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pick Detail Modal (full content + image) ──────────────
function PickDetailModal({ prediction, onClose }: { prediction: Prediction; onClose: () => void }) {
  // Close on backdrop click
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0b1120] border border-emerald-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-extrabold text-white">Pick Desbloqueado</span>
            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{prediction.sport}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1"><X className="h-5 w-5" /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Tipster */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {prediction.tipster?.name?.substring(0, 2).toUpperCase() || 'TS'}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white">{prediction.tipster?.name}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-400 font-semibold">Yield {prediction.tipster?.stats?.yield ?? 0}% · @{prediction.odds.toFixed(2)} · Stake {prediction.stake}/10</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">📋 Apuesta</p>
            <p className="text-base font-bold text-white leading-relaxed">{prediction.description}</p>
          </div>

          {/* Argumentation */}
          {prediction.argumentation && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">🧠 Análisis del Tipster</p>
              <p className="text-sm text-slate-300 leading-relaxed">{prediction.argumentation}</p>
            </div>
          )}

          {/* Full image — no height cap */}
          {prediction.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prediction.imageUrl}
                alt="Captura de apuesta"
                className="w-full object-contain bg-black"
              />
            </div>
          )}

          {/* Bet link */}
          {prediction.betLink && (
            <a
              href={prediction.betLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-sm transition"
            >
              <ExternalLink className="h-4 w-4" /> Ver apuesta en casa de apuestas
            </a>
          )}
        </div>

        {/* Close footer */}
        <div className="px-5 py-4 border-t border-white/5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition hover:bg-emerald-500/20"
          >
            ✓ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pick Card ─────────────────────────────────────────────
function PickCard({ prediction, onBuy }: { prediction: Prediction; onBuy: (p: Prediction) => void }) {
  const expirationDate = prediction.availableUntil ? new Date(prediction.availableUntil) : new Date(prediction.eventDate);
  const initialLive = prediction.isLive || (expirationDate <= new Date() && !prediction.isCompleted);
  const [isLive, setIsLive] = useState(initialLive);
  const [localPred, setLocalPred] = useState(prediction);
  const [showDetail, setShowDetail] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isUnlocked = localPred.isUnlocked;
  const hasPending = localPred.hasPendingPurchase;

  // Re-check live status every 5 seconds for real-time transition
  useEffect(() => {
    if (isLive || localPred.isCompleted) return;
    const expiration = localPred.availableUntil ? new Date(localPred.availableUntil) : new Date(localPred.eventDate);
    const id = setInterval(() => {
      if (expiration <= new Date()) setIsLive(true);
    }, 5_000);
    return () => clearInterval(id);
  }, [isLive, localPred.eventDate, localPred.availableUntil, localPred.isCompleted]);

  // Auto-polling: re-fetch this prediction every 8s if payment is pending
  useEffect(() => {
    if (!hasPending || isUnlocked) return;

    const poll = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/predictions/${localPred.id}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        const updated: Prediction = data.prediction;
        if (updated.isUnlocked) {
          // Payment approved! Update local state and trigger full refresh
          setLocalPred(updated);
          usePredictionStore.getState().fetchPredictions();
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {}
    };

    pollingRef.current = setInterval(poll, 8_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending, isUnlocked, localPred.id]);

  // Sync when parent prediction prop changes (e.g. after global refresh)
  useEffect(() => {
    setLocalPred(prediction);
  }, [prediction]);

  return (
    <>
    <div className={`rounded-2xl border overflow-hidden mb-3 transition-all ${
      isLive && !isUnlocked
        ? 'border-red-500/20 bg-slate-900/70'
        : 'border-white/5 bg-slate-900/70'
    }`}>
      {/* Top strip */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {localPred.sport}
          </span>
          {localPred.isFixed && (
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full animate-pulse">
              📌 FIJA
            </span>
          )}
          <span className="text-xs text-slate-500">{localPred.league}</span>
        </div>
        {isLive ? (
          <span className="badge-live flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
            <Flame className="h-3 w-3" /> EN JUEGO
          </span>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
            <Clock className="h-3 w-3" />
            <TimeUntil date={localPred.availableUntil || localPred.eventDate} onExpired={() => setIsLive(true)} />
          </div>
        )}
      </div>

      {/* Tipster row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
          {localPred.tipster?.name?.substring(0, 2).toUpperCase() || 'TS'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white truncate">{localPred.tipster?.name}</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-emerald-400 font-semibold">Yield {localPred.tipster?.stats?.yield ?? 0}%</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-2.5 w-2.5 ${i < 4 ? 'text-amber-400' : 'text-slate-700'}`}
                  fill={i < 4 ? 'currentColor' : 'none'} />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-white">@{localPred.odds.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-400 font-semibold">Stake {localPred.stake}/10</p>
        </div>
      </div>

      {/* Content — clickable when unlocked to open full detail */}
      <div className="px-4 pb-4">
        {isUnlocked ? (
          <button
            onClick={() => setShowDetail(true)}
            className="w-full text-left bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition group"
          >
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Desbloqueado — Toca para ver todo</span>
              </div>
              <ZoomIn className="h-3.5 w-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">{localPred.description}</p>
            {localPred.imageUrl && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localPred.imageUrl}
                  alt="Apuesta"
                  className="w-full object-cover max-h-44"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full p-2">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            )}
            {localPred.betLink && (
              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-400">
                🔗 Ver apuesta <ChevronRight className="h-3 w-3" />
              </div>
            )}
          </button>
        ) : hasPending ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <Clock className="h-5 w-5 text-amber-400 mx-auto mb-2 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Pago en verificación ⏳</span>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Tu comprobante ha sido enviado. El tipster está verificando la transferencia. Se actualizará automáticamente.
            </p>
            {/* Animated dots to show it's checking */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bloqueado</span>
            </div>
            <div className="space-y-1.5">
              {[90, 75, 55].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full bg-slate-800/70 animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        {isLive && !isUnlocked ? (
          <button disabled
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
            <Flame className="h-4 w-4 text-red-500" />
            En juego — venta cerrada
          </button>
        ) : isUnlocked ? (
          <button
            onClick={() => setShowDetail(true)}
            className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition press"
          >
            <CheckCircle className="h-4 w-4" /> Pick comprado — Ver detalles
          </button>
        ) : hasPending ? (
          <div className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-amber-400 animate-pulse" /> Verificando pago...
          </div>
        ) : (
          <button onClick={() => onBuy(localPred)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm transition hover:opacity-90 press flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
            <TrendingUp className="h-4 w-4" />
            Desbloquear — S/. {localPred.price.toFixed(2)}
          </button>
        )}
      </div>
    </div>

    {/* Full Detail Modal */}
    {showDetail && isUnlocked && (
      <PickDetailModal prediction={localPred} onClose={() => setShowDetail(false)} />
    )}
    </>
  );
}

// ── Main Home ────────────────────────────────────────────
export default function Home() {
  const { predictions, loading, fetchPredictions } = usePredictionStore();
  const { user, accessToken } = useAuthStore();
  const [checkoutPred, setCheckoutPred] = useState<Prediction | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions, accessToken]);

  const liveCount = predictions.filter(p => {
    const expiration = p.availableUntil ? new Date(p.availableUntil) : new Date(p.eventDate);
    return p.isLive || (expiration <= new Date() && !p.isCompleted);
  }).length;

  return (
    <div className="flex flex-col flex-1 bg-[#050810]">
      {/* Hero */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">Picks del Día</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {user ? `Hola, ${user.name} 👋` : 'Picks verificados por expertos'}
            </p>
          </div>
          {liveCount > 0 && (
            <div className="badge-live flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <Flame className="h-3.5 w-3.5" />
              {liveCount} en juego
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-emerald-400">68%</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Acierto</p>
          </div>
          <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-cyan-400">+24.5%</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Yield</p>
          </div>
          <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-white">{predictions.length}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Picks</p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 px-4 pb-4">
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-800/30 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && predictions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 text-2xl">🎯</div>
            <p className="text-slate-400 font-semibold">No hay picks publicados aún</p>
            <p className="text-slate-600 text-sm mt-1">Vuelve pronto para ver nuevos pronósticos</p>
          </div>
        )}

        {!loading && predictions.map((pred) => (
          <PickCard key={pred.id} prediction={pred} onBuy={setCheckoutPred} />
        ))}
      </div>

      {checkoutPred && (
        <CheckoutModal prediction={checkoutPred} onClose={() => { setCheckoutPred(null); fetchPredictions(); }} />
      )}
    </div>
  );
}
