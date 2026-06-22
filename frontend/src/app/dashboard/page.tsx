'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePredictionStore, Prediction } from '@/store/usePredictionStore';
import { useRouter } from 'next/navigation';
import { PlusCircle, ShieldAlert, Award, Calendar, DollarSign, Wallet, FileText, Check, X, Upload, Image, Clock, ChevronDown } from 'lucide-react';
import { getAPI_URL, getBaseUrl } from '@/utils/config';

export default function Dashboard() {
  const { user, accessToken } = useAuthStore();
  const { fetchPredictions, createPrediction, resolvePrediction, approveManualPayment } = usePredictionStore();
  const router = useRouter();

  // Common State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CREATE_PICK' | 'SALES' | 'PURCHASES' | 'ADMIN_PAYMENTS'>('OVERVIEW');
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Tipster specific data
  const [publishedPicks, setPublishedPicks] = useState<Prediction[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [totalSalesEarnings, setTotalSalesEarnings] = useState(0);

  // Punter specific data
  const [purchasedPicks, setPurchasedPicks] = useState<any[]>([]);

  // Admin specific data
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Create Pick Form state
  const [sport, setSport] = useState('Fútbol');
  const [league, setLeague] = useState('');
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('5');
  const [price, setPrice] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [argumentation, setArgumentation] = useState('');
  const [betLink, setBetLink] = useState('');
  const [isFixed] = useState(true);
  const [availableUntilHour, setAvailableUntilHour] = useState('18');
  const [availableUntilMinute, setAvailableUntilMinute] = useState('30');

  // Admin Approval dialog state
  const [referenceCodeMap, setReferenceCodeMap] = useState<{ [key: string]: string }>({});

  const API_URL = getAPI_URL();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Set default tab based on role
    if (user.role === 'TIPSTER') {
      setActiveTab('OVERVIEW');
      loadTipsterData();
      loadPendingPayments();
    } else if (user.role === 'PUNTER') {
      setActiveTab('PURCHASES');
      loadPunterData();
    } else if (user.role === 'ADMIN') {
      setActiveTab('ADMIN_PAYMENTS');
      loadAdminData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  // Data Loading Helpers
  const loadTipsterData = async () => {
    if (!accessToken || !user) return;
    setDashboardLoading(true);
    try {
      // 1. Get published picks (filters by this tipster)
      const resPicks = await fetch(`${API_URL}/predictions?tipsterId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const dataPicks = await resPicks.json();
      if (resPicks.ok) setPublishedPicks(dataPicks.predictions);

      // 2. Get sales history
      const resSales = await fetch(`${API_URL}/purchases/history/sales`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const dataSales = await resSales.json();
      if (resSales.ok) {
        setSalesHistory(dataSales.sales);
        setTotalSalesEarnings(dataSales.totalEarnings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadPunterData = async () => {
    if (!accessToken) return;
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/purchases/history/purchases`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) setPurchasedPicks(data.purchases);
    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadPendingPayments = async () => {
    if (!accessToken) return;
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/purchases/pending`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPendingPayments(data.purchases);
      }
    } catch (err) {
      console.error('Error loading pending payments:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadAdminData = async () => {
    await loadPendingPayments();
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'ADMIN_PAYMENTS') {
      loadPendingPayments();
    } else if (tab === 'SALES') {
      loadTipsterData();
    } else if (tab === 'OVERVIEW' && user?.role === 'TIPSTER') {
      loadTipsterData();
    } else if (tab === 'PURCHASES' && user?.role === 'PUNTER') {
      loadPunterData();
    }
  };

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Helper to calculate the availableUntil datetime based only on chosen hour and minute.
  // If the time has already passed today, it assumes tomorrow.
  const getAvailableUntilDateTime = (hourStr: string, minuteStr: string) => {
    const now = new Date();
    const expHour = parseInt(hourStr, 10);
    const expMin = parseInt(minuteStr, 10);
    
    // Create a date object for today with the selected hour and minute
    const expDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), expHour, expMin, 0);
    
    // If that time has already passed today, assume it is for tomorrow
    if (expDate <= now) {
      expDate.setDate(expDate.getDate() + 1);
    }
    
    // Format as YYYY-MM-DDTHH:MM
    const year = expDate.getFullYear();
    const month = String(expDate.getMonth() + 1).padStart(2, '0');
    const day = String(expDate.getDate()).padStart(2, '0');
    const hour = String(expDate.getHours()).padStart(2, '0');
    const minute = String(expDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Actions handlers
  const handleCreatePick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setDashboardLoading(true);

    // 1. Upload image if a file was selected
    let finalImageUrl = imageUrl;
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      try {
        const uploadRes = await fetch(`${API_URL}/upload/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          finalImageUrl = uploadData.imageUrl.startsWith('http') ? uploadData.imageUrl : `${getBaseUrl()}${uploadData.imageUrl}`;
        } else {
          alert('Error al subir la imagen: ' + (uploadData.error || 'Error desconocido'));
          setDashboardLoading(false);
          return;
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Error de conexión al subir la imagen.');
        setDashboardLoading(false);
        return;
      }
    }

    const deadline = isFixed ? getAvailableUntilDateTime(availableUntilHour, availableUntilMinute) : null;

    // 2. Create prediction with uploaded image URL
    const success = await createPrediction({
      sport,
      league: 'Fija',
      eventDate: deadline || new Date().toISOString(),
      odds: parseFloat(odds),
      stake: 10,
      price: parseFloat(price),
      description,
      imageUrl: finalImageUrl,
      argumentation,
      betLink,
      isFixed,
      availableUntil: deadline,
    }, accessToken);

    setDashboardLoading(false);
    if (success) {
      alert('¡Pick publicado con éxito!');
      setLeague('');
      setOdds('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      setImagePreview(null);
      setArgumentation('');
      setBetLink('');
      setAvailableUntilHour('18');
      setAvailableUntilMinute('30');
      setActiveTab('OVERVIEW');
      loadTipsterData();
    } else {
      alert('Error al publicar el pick.');
    }
  };

  const handleResolvePick = async (id: string, result: 'WON' | 'LOST' | 'VOID') => {
    if (!accessToken) return;
    if (!confirm(`¿Estás seguro de marcar esta apuesta como ${result}?`)) return;

    setDashboardLoading(true);
    const success = await resolvePrediction(id, result, accessToken);
    setDashboardLoading(false);
    
    if (success) {
      alert('Pronóstico resuelto con éxito.');
      loadTipsterData();
      // Also update auth state user statistics since they changed!
      const profileRes = await fetch(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const profileData = await profileRes.json();
      if (profileRes.ok) {
        useAuthStore.setState({ user: profileData.user });
      }
    } else {
      alert('Error al resolver la apuesta.');
    }
  };

  const handleAdminApprove = async (purchaseId: string, paymentMethod: string) => {
    if (!accessToken) return;
    const purchase = pendingPayments.find(p => p.id === purchaseId);
    const refCode = referenceCodeMap[purchaseId] || purchase?.referenceCode || `APROB_${Math.floor(100000 + Math.random() * 900000)}`;
    
    setDashboardLoading(true);
    const success = await approveManualPayment(purchaseId, paymentMethod, refCode, accessToken);
    setDashboardLoading(false);

    if (success) {
      alert('¡Pago manual aprobado! El pick ha sido desbloqueado.');
      loadPendingPayments();
    } else {
      alert('Error al aprobar el pago manual.');
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 pb-6">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              {user.role === 'TIPSTER' ? '📊 Panel Tipster' : user.role === 'ADMIN' ? '🛡️ Panel Admin' : '🎯 Mis Picks'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{user.name}</p>
          </div>
          {user.role === 'TIPSTER' && user.stats && (
            <div className="flex gap-3 text-right">
              <div>
                <p className="text-sm font-extrabold text-emerald-400">{user.stats.yield}%</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Yield</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">{user.stats.wonPredictions}/{user.stats.totalPredictions}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Picks</p>
              </div>
            </div>
          )}
        </div>
      </div>
        
        {/* Profile header card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white uppercase">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : user.name.substring(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
              <p className="text-sm text-slate-400">Rol: <span className="text-emerald-400 font-semibold uppercase">{user.role}</span></p>
            </div>
          </div>

          {/* Tipster Stats metrics */}
          {user.role === 'TIPSTER' && user.stats && (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Yield</p>
                <p className="text-lg font-extrabold text-emerald-400">{user.stats.yield}%</p>
              </div>
              <div className="text-center border-l border-slate-800 pl-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ganancias</p>
                <p className="text-lg font-extrabold text-cyan-400">S/. {user.stats.profit}</p>
              </div>
              <div className="text-center border-l border-slate-800 pl-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Picks</p>
                <p className="text-lg font-extrabold text-white">{user.stats.wonPredictions}/{user.stats.totalPredictions}</p>
              </div>
            </div>
          )}
        </div>

      {/* Tab navigator - horizontal scroll */}
      <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide border-b border-white/5">
          {user.role === 'TIPSTER' && (
            <>
              {(['OVERVIEW','CREATE_PICK','SALES','ADMIN_PAYMENTS'] as const).map((tab, i) => (
                <button key={tab} onClick={() => handleTabChange(tab)}
                  className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${activeTab === tab
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white bg-slate-900/60 border border-white/5'
                  }`}>
                  {['Mis Picks','Publicar','Ventas','Validar Pagos'][i]}
                </button>
              ))}
            </>
          )}
          {user.role === 'PUNTER' && (
            <button onClick={() => handleTabChange('PURCHASES')}
              className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${activeTab === 'PURCHASES'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 bg-slate-900/60 border border-white/5'
              }`}>Picks Comprados</button>
          )}
          {user.role === 'ADMIN' && (
            <button onClick={() => handleTabChange('ADMIN_PAYMENTS')}
              className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all ${activeTab === 'ADMIN_PAYMENTS'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 bg-slate-900/60 border border-white/5'
              }`}>Validar Pagos</button>
          )}
        </div>

        {/* Tab content */}
        <div className="mt-4 px-4">
          {dashboardLoading && (
            <div className="text-center py-12 text-slate-400 text-sm">Cargando información...</div>
          )}

          {/* 1. TIPSTER OVERVIEW */}
          {!dashboardLoading && activeTab === 'OVERVIEW' && user.role === 'TIPSTER' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Listado de Pronósticos</h3>
              {publishedPicks.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-xl">No has publicado ningún pick aún.</div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                  {publishedPicks.map((pick) => (
                    <div key={pick.id} className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">{pick.sport}</span>
                            {pick.isFixed && (
                              <span className="font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">📌 FIJA</span>
                            )}
                          </div>
                          <span>{pick.league}</span>
                        </div>
                        <div className="mt-4 flex gap-4 text-sm font-semibold">
                          <div>Cuota: <span className="text-white">@{pick.odds.toFixed(2)}</span></div>
                          <div>Stake: <span className="text-emerald-400">{pick.stake}/10</span></div>
                          <div>Precio: <span className="text-cyan-400">S/. {pick.price.toFixed(2)}</span></div>
                        </div>
                        <p className="mt-3 text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded border border-slate-800">{pick.description}</p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800/50 flex justify-between items-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          pick.isCompleted 
                            ? pick.result === 'WON' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : pick.result === 'LOST' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : 'bg-slate-800 text-slate-400' 
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {pick.isCompleted ? `RESUELTO: ${pick.result}` : 'PENDIENTE'}
                        </span>

                        {!pick.isCompleted && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolvePick(pick.id, 'WON')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded transition"
                            >
                              Ganada
                            </button>
                            <button
                              onClick={() => handleResolvePick(pick.id, 'LOST')}
                              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                            >
                              Perdida
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. TIPSTER CREATE PICK */}
          {!dashboardLoading && activeTab === 'CREATE_PICK' && user.role === 'TIPSTER' && (
            <div className="max-w-2xl glass-panel rounded-2xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-400" /> Publicar Nuevo Pick Premium
              </h3>
              
              <form className="mt-6 space-y-4" onSubmit={handleCreatePick}>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deporte</label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Fútbol">Fútbol</option>
                      <option value="Baloncesto">Baloncesto</option>
                      <option value="Tenis">Tenis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cuota</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ej: 1.85"
                      value={odds}
                      onChange={(e) => setOdds(e.target.value)}
                      className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Precio (S/.)</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      placeholder="Ej: 10.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>



                {/* Título de la apuesta */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Título de la apuesta
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Barcelona gana"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Argumentación detallada */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" /> Argumentación detallada
                  </label>
                  <textarea
                    rows={5}
                    placeholder={`Explica detalladamente tu análisis:\n• ¿Por qué esta apuesta?\n• Estadísticas clave\n• Forma reciente de los equipos\n• Factores determinantes`}
                    value={argumentation}
                    onChange={(e) => setArgumentation(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 p-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none transition leading-relaxed"
                  />
                </div>

                {/* Imagen de la apuesta */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Imagen de la apuesta
                  </label>
                  <div className="mt-2 relative border-2 border-dashed border-slate-800 hover:border-violet-600/50 rounded-2xl overflow-hidden bg-slate-950/40 min-h-[140px] flex items-center justify-center transition">
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full object-cover max-h-48 rounded-2xl"
                        />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          className="absolute top-2 right-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full p-1 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="pick-image-upload-fixed"
                        className="flex flex-col items-center justify-center gap-2.5 cursor-pointer p-6 text-center w-full h-full"
                      >
                        <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                          </svg>
                        </div>
                        <span className="text-xs text-slate-300 font-semibold">Subir imagen desde archivos</span>
                        <input
                          id="pick-image-upload-fixed"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Link de la apuesta */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Link de la apuesta
                  </label>
                  <div className="mt-2 relative">
                    <input
                      type="url"
                      placeholder="https://miapuesta.com/abc123"
                      value={betLink}
                      onChange={(e) => setBetLink(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3.5 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Disponible hasta (hora) */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Disponible hasta (hora)
                  </label>
                  <div className="mt-2 w-full rounded-xl bg-slate-900/50 border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[96px]">
                    <span className="text-xs font-semibold text-slate-300 mb-3">
                      Seleccionar hora
                    </span>
                    
                    <div className="flex items-center gap-3">
                      {/* Hours Dropdown */}
                      <div className="relative">
                        <select
                          required
                          value={availableUntilHour}
                          onChange={(e) => setAvailableUntilHour(e.target.value)}
                          className="appearance-none bg-[#1D1243] hover:bg-[#28195d] border border-[#4B28A4] rounded-xl pl-6 pr-10 py-3 text-2xl font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer text-center min-w-[90px] transition"
                        >
                          {Array.from({ length: 24 }, (_, h) => {
                            const val = h.toString().padStart(2, '0');
                            return <option key={val} value={val} className="bg-slate-950 text-base">{val}</option>;
                          })}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300 pointer-events-none" />
                      </div>

                      {/* Separator */}
                      <span className="text-2xl font-extrabold text-violet-400">:</span>

                      {/* Minutes Dropdown */}
                      <div className="relative">
                        <select
                          required
                          value={availableUntilMinute}
                          onChange={(e) => setAvailableUntilMinute(e.target.value)}
                          className="appearance-none bg-[#1D1243] hover:bg-[#28195d] border border-[#4B28A4] rounded-xl pl-6 pr-10 py-3 text-2xl font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer text-center min-w-[90px] transition"
                        >
                          {Array.from({ length: 60 }, (_, m) => {
                            const val = m.toString().padStart(2, '0');
                            return <option key={val} value={val} className="bg-slate-950 text-base">{val}</option>;
                          })}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-semibold text-slate-950 py-3.5 hover:opacity-90 transition font-bold"
                >
                  Publicar Pick Premium
                </button>
              </form>
            </div>
          )}

          {/* 3. TIPSTER SALES HISTORY */}
          {!dashboardLoading && activeTab === 'SALES' && user.role === 'TIPSTER' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Historial de Ventas</h3>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" /> Ganancias Totales Netas: S/. {totalSalesEarnings.toFixed(2)}
                </div>
              </div>

              {salesHistory.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-xl">No has realizado ninguna venta todavía.</div>
              ) : (
                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-xs uppercase text-slate-400 font-bold">
                      <tr>
                        <th className="p-4">ID Compra</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Método</th>
                        <th className="p-4">Total Pagado</th>
                        <th className="p-4">Comisión Plataforma (10%)</th>
                        <th className="p-4 text-emerald-400">Tus Ganancias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {salesHistory.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-900/50 transition">
                          <td className="p-4 font-mono text-xs">{sale.purchaseId.substring(0, 8)}...</td>
                          <td className="p-4">
                            <p className="font-semibold text-white">{sale.purchase?.punter?.name}</p>
                            <p className="text-xs text-slate-400">{sale.purchase?.punter?.email}</p>
                          </td>
                          <td className="p-4 font-bold text-xs uppercase">{sale.paymentMethod}</td>
                          <td className="p-4">S/. {sale.amount.toFixed(2)}</td>
                          <td className="p-4 text-rose-400">-S/. {sale.platformFee.toFixed(2)}</td>
                          <td className="p-4 font-bold text-emerald-400">S/. {sale.tipsterEarnings.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. PUNTER PURCHASES */}
          {!dashboardLoading && activeTab === 'PURCHASES' && user.role === 'PUNTER' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Tus Pronósticos Premium Adquiridos</h3>
              {purchasedPicks.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-xl">No has comprado ningún pick aún. ¡Explora el marketplace!</div>
              ) : (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                  {purchasedPicks.map((p) => {
                    const pick = p.prediction;
                    const isLive = pick.isLive || (new Date(pick.eventDate) <= new Date() && !pick.isCompleted);
                    return (
                      <div key={p.id} className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center text-xs text-slate-400">
                            <span className="font-semibold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">{pick.sport}</span>
                            <div className="flex items-center gap-2">
                              <span>{pick.league}</span>
                              {isLive && (
                                <span className="animate-pulse bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">🔥 EN JUEGO</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="h-3 w-3" /> Evento: {new Date(pick.eventDate).toLocaleString()}
                          </div>

                          <div className="mt-4 flex gap-4 text-sm font-semibold">
                            <div>Cuota: <span className="text-white">@{pick.odds.toFixed(2)}</span></div>
                            <div>Stake: <span className="text-emerald-400">{pick.stake}/10</span></div>
                          </div>

                          {/* Pick details depending on status */}
                          {p.status === 'PENDING' ? (
                            <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                              <Clock className="h-6 w-6 text-amber-400 mx-auto mb-2 animate-pulse" />
                              <p className="text-sm font-extrabold text-amber-400">Pago en verificación ⏳</p>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                Tu comprobante ha sido enviado. El tipster está verificando la transferencia para desbloquear el pick.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                              <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" /> Pick y Análisis Completo Desbloqueado:
                              </div>
                              <p className="mt-2 text-xs text-slate-200 leading-relaxed font-medium">{pick.description}</p>

                              {pick.argumentation && (
                                <div className="mt-3 pt-3 border-t border-emerald-500/10">
                                  <p className="text-[10px] uppercase font-bold text-cyan-400 mb-1">🧠 Argumentación:</p>
                                  <p className="text-xs text-slate-300 leading-relaxed">{pick.argumentation}</p>
                                </div>
                              )}

                              {pick.imageUrl && (
                                <div className="mt-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={pick.imageUrl} alt="Imagen de la apuesta" className="rounded-lg w-full object-cover max-h-48 border border-slate-700" />
                                </div>
                              )}

                              {pick.betLink && (
                                <a
                                  href={pick.betLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                                >
                                  🔗 Ver apuesta en casa de apuestas
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-800/50 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Tipster: {pick.tipster?.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            pick.isCompleted 
                              ? pick.result === 'WON' 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                              : isLive
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {pick.isCompleted ? `Resultado: ${pick.result}` : isLive ? '🔥 En Juego' : 'Pendiente del evento'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. ADMIN APPROVALS */}
          {!dashboardLoading && activeTab === 'ADMIN_PAYMENTS' && (user.role === 'ADMIN' || user.role === 'TIPSTER') && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Validación de Transferencias Manuales</h3>
              
              {pendingPayments.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-xl">No hay comprobantes de pago pendientes de validación.</div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((p) => (
                    <div key={p.id} className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/40 flex flex-col gap-4">
                      {/* Top Row: User details & Payment Method */}
                      <div className="flex justify-between items-start border-b border-white/5 pb-3">
                        <div>
                          <p className="font-extrabold text-white text-sm">{p.punter?.name || 'Cliente Invitado'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.punter?.email || p.guestEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                            p.paymentMethod === 'YAPE' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {p.paymentMethod || 'YAPE'}
                          </span>
                          <p className="text-sm font-black text-white mt-1.5">S/. {p.amountPaid.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Middle Row: Pick Details */}
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Detalles del Pick</p>
                          <p className="font-bold text-white mt-0.5">{p.prediction?.sport} — {p.prediction?.league}</p>
                          <p className="text-slate-400 mt-0.5">Cuota: @{p.prediction?.odds}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Código Enviado</p>
                          <p className="font-mono text-emerald-400 font-bold mt-0.5">{p.referenceCode || `REF-${p.id.substring(0,6).toUpperCase()}`}</p>
                        </div>
                      </div>

                      {/* Bottom Row: Screenshot Preview & Actions */}
                      <div className="flex items-center gap-4 pt-1">
                        {p.screenshotUrl ? (
                          <div className="shrink-0">
                            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] mb-1">Captura de Pago</p>
                            <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" 
                              className="group relative block w-16 h-16 rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500 transition shadow-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.screenshotUrl} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-110 transition duration-200" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <span className="text-[9px] text-white font-bold">Ver 🔍</span>
                              </div>
                            </a>
                          </div>
                        ) : (
                          <div className="shrink-0 w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center border border-dashed border-slate-800 text-slate-600 text-xs">
                            Sin foto
                          </div>
                        )}

                        <div className="flex-1 flex flex-col justify-end gap-1.5">
                          <label className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Acción de Aprobación</label>
                          <div className="flex gap-2 w-full">
                            <input
                              type="text"
                              placeholder="Ref. Interna (opcional)"
                              value={referenceCodeMap[p.id] || ''}
                              onChange={(e) => setReferenceCodeMap({
                                ...referenceCodeMap,
                                [p.id]: e.target.value
                              })}
                              className="flex-1 min-w-0 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                            />
                            <button
                              onClick={() => handleAdminApprove(p.id, p.paymentMethod || 'YAPE')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-2 rounded-xl transition flex items-center justify-center font-bold text-xs gap-1 shrink-0"
                              title="Aprobar Pago"
                            >
                              <Check className="h-3.5 w-3.5" /> Ok
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
  );
}
