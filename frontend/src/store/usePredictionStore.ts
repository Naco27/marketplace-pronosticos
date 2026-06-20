import { create } from 'zustand';
import { getAPI_URL } from '@/utils/config';

export interface Prediction {
  id: string;
  tipsterId: string;
  sport: string;
  league: string;
  eventDate: string;
  odds: number;
  stake: number;
  price: number;
  description: string;
  imageUrl?: string | null;
  argumentation?: string | null;
  betLink?: string | null;
  isFixed: boolean;
  availableUntil?: string | null;
  isCompleted: boolean;
  isLive?: boolean;
  result: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  createdAt: string;
  isUnlocked?: boolean;
  hasPendingPurchase?: boolean;
  tipster?: {
    id: string;
    name: string;
    avatarUrl?: string;
    stats?: {
      totalPredictions: number;
      wonPredictions: number;
      yield: number;
      profit: number;
    };
  };
}

interface PredictionState {
  predictions: Prediction[];
  purchasedPicks: any[];
  pendingPayments: any[];
  loading: boolean;
  purchasedLoading: boolean;
  error: string | null;

  fetchPredictions: (filters?: {
    sport?: string;
    league?: string;
    minOdds?: number;
    maxOdds?: number;
    tipsterId?: string;
  }) => Promise<void>;
  
  fetchPredictionById: (id: string, token?: string | null) => Promise<Prediction | null>;
  
  createPrediction: (
    predictionData: Omit<Prediction, 'id' | 'createdAt' | 'isCompleted' | 'result' | 'tipsterId'>,
    token: string
  ) => Promise<boolean>;

  checkout: (
    predictionId: string,
    paymentMethod: 'STRIPE' | 'PAYPAL' | 'YAPE' | 'PLIN' | 'FREE_BET',
    token: string | null,
    guestEmail?: string
  ) => Promise<{ paymentUrl?: string; instructions?: string; purchaseId?: string }>;

  submitProof: (purchaseId: string, referenceCode: string, screenshotUrl: string | null, token: string | null) => Promise<string | boolean>;

  approveManualPayment: (purchaseId: string, paymentMethod: string, referenceCode: string, token: string) => Promise<boolean>;
  
  resolvePrediction: (id: string, result: 'WON' | 'LOST' | 'VOID', token: string) => Promise<boolean>;

  fetchPurchasedPicks: (token: string | null) => Promise<void>;
  
  fetchPendingPayments: (token: string) => Promise<void>;
}

const API_URL = {
  toString() {
    return getAPI_URL();
  }
} as unknown as string;

export const usePredictionStore = create<PredictionState>((set, get) => ({
  predictions: [],
  purchasedPicks: [],
  pendingPayments: [],
  loading: false,
  purchasedLoading: false,
  error: null,

  fetchPredictions: async (filters) => {
    // SWR: Solo activar loading si no hay predicciones previas en el store
    const currentPredictions = get().predictions;
    const shouldShowSkeleton = currentPredictions.length === 0;

    set({ loading: shouldShowSkeleton, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.sport) queryParams.append('sport', filters.sport);
        if (filters.league) queryParams.append('league', filters.league);
        if (filters.minOdds) queryParams.append('minOdds', filters.minOdds.toString());
        if (filters.maxOdds) queryParams.append('maxOdds', filters.maxOdds.toString());
        if (filters.tipsterId) queryParams.append('tipsterId', filters.tipsterId);
      }

      // Read token from localStorage if available to authenticate the fetch
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/predictions?${queryParams.toString()}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch predictions');
      }

      set({ predictions: data.predictions, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPredictionById: async (id, token) => {
    try {
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/predictions/${id}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.prediction;
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  createPrediction: async (predictionData, token) => {
    try {
      const response = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(predictionData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // Refresh predictions feed
      get().fetchPredictions();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  checkout: async (predictionId, paymentMethod, token, guestEmail) => {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/purchases/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ predictionId, paymentMethod, guestEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar el pago');
      return data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  },

  submitProof: async (purchaseId, referenceCode, screenshotUrl, token) => {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/purchases/submit-proof`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ purchaseId, referenceCode, screenshotUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al procesar el pago');

      // Silently refresh predictions and purchased picks in the background for fluid update
      get().fetchPredictions();
      get().fetchPurchasedPicks(token);

      return data.description || true;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  },

  approveManualPayment: async (purchaseId, paymentMethod, referenceCode, token) => {
    try {
      const response = await fetch(`${API_URL}/purchases/approve-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ purchaseId, paymentMethod, referenceCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  resolvePrediction: async (id, result, token) => {
    try {
      const response = await fetch(`${API_URL}/predictions/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ result }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // Refresh state
      get().fetchPredictions();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  fetchPurchasedPicks: async (token) => {
    if (!token) return;
    
    // SWR: Solo activar loading si no hay compras previas en el store
    const currentPurchased = get().purchasedPicks;
    const shouldShowSkeleton = currentPurchased.length === 0;

    set({ purchasedLoading: shouldShowSkeleton });
    try {
      const response = await fetch(`${API_URL}/purchases/history/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch purchases');
      set({ purchasedPicks: data.purchases, purchasedLoading: false });
    } catch (err: any) {
      console.error(err);
      set({ purchasedLoading: false });
    }
  },

  fetchPendingPayments: async (token) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/purchases/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      set({ pendingPayments: data.purchases });
    } catch (err) {
      console.error('Error fetching pending payments:', err);
    }
  },
}));
