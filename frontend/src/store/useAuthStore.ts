import { create } from 'zustand';
import { getAPI_URL } from '@/utils/config';

export interface User {
  id: string;
  email?: string;
  username?: string;
  name: string;
  role: 'ADMIN' | 'TIPSTER' | 'PUNTER';
  isVerified: boolean;
  avatarUrl?: string;
  freeBetsCount?: number;
  stats?: {
    totalPredictions: number;
    wonPredictions: number;
    yield: number;
    profit: number;
  };
}

interface LoginData {
  role?: string;
  email?: string;
  password?: string;
  username?: string;
  code?: string;
}

interface RegisterData {
  role: string;
  name: string;
  email?: string;
  password?: string;
  username?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
}

const API_URL = {
  toString() {
    return getAPI_URL();
  }
} as unknown as string;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,

  initialize: () => {
    if (typeof window === 'undefined') return;
    const storedUser = localStorage.getItem('user');
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');

    if (storedUser && storedAccess && storedRefresh) {
      set({
        user: JSON.parse(storedUser),
        accessToken: storedAccess,
        refreshToken: storedRefresh,
      });
    }
  },

  setTokens: (accessToken, refreshToken, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ accessToken, refreshToken, user, error: null });
  },

  login: async (data: LoginData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Login failed');
      }

      get().setTokens(resData.accessToken, resData.refreshToken, resData.user);
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  register: async (data: RegisterData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Registration failed');
      }

      get().setTokens(resData.accessToken, resData.refreshToken, resData.user);
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },
}));
