'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { getAPI_URL } from '@/utils/config';

function PaymentSimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();

  const purchaseId = searchParams.get('purchaseId');
  const method = searchParams.get('method') || 'STRIPE';

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('***');
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_URL = getAPI_URL();

  useEffect(() => {
    // Fetch purchase amount if needed or mock it
    setAmount(15.0); // static mock amount for preview
  }, [purchaseId]);

  const handlePay = async () => {
    if (!purchaseId) return;
    setLoading(true);

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}/purchases/simulate-success`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          purchaseId,
          transactionId: `sim_${method.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!accessToken && data.predictionId && data.description) {
          const stored = localStorage.getItem('guest_unlocked_picks');
          const obj = stored ? JSON.parse(stored) : {};
          obj[data.predictionId] = data.description;
          localStorage.setItem('guest_unlocked_picks', JSON.stringify(obj));
        }
        setSuccess(true);
      } else {
        alert(data.error || 'Error en la simulación del pago.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center bg-grid bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl">
        {!success ? (
          <div>
            <div className="text-center">
              <span className="inline-flex rounded-full bg-emerald-500/10 p-2 text-emerald-400">
                <CreditCard className="h-6 w-6" />
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-white mt-4">
                Pasarela de Pago Segura
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Simulación del checkout integrado ({method})
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">Monto total:</span>
                <span className="text-lg font-bold text-white">S/. {amount?.toFixed(2)}</span>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Número de Tarjeta</label>
                <input
                  type="text"
                  disabled
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vencimiento</label>
                  <input
                    type="text"
                    disabled
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">CVC</label>
                  <input
                    type="password"
                    disabled
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full mt-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-semibold text-slate-950 py-3.5 hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? 'Procesando Pago Seguro...' : 'Confirmar Simulación de Pago'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <span className="inline-flex rounded-full bg-emerald-500/10 p-3 text-emerald-400">
              <ShieldCheck className="h-10 w-10" />
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-white mt-4">
              ¡Pago Aprobado!
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              La transacción se completó con éxito. Tu pick ha sido desbloqueado.
            </p>
            <button
              onClick={() => {
                router.push(accessToken ? '/dashboard' : '/');
                router.refresh();
              }}
              className="w-full mt-8 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-semibold text-slate-950 py-3.5 hover:opacity-90 transition"
            >
              {accessToken ? 'Ir a mi Panel de Apostador' : 'Ver Pick Desbloqueado'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSimulation() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 text-sm">Cargando pasarela de pago...</div>}>
      <PaymentSimulationContent />
    </Suspense>
  );
}
