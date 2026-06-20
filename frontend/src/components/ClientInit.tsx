'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAPI_URL } from '@/utils/config';

const API_URL = {
  toString() {
    return getAPI_URL();
  }
} as unknown as string;

export default function ClientInit() {
  const { initialize, setTokens, user } = useAuthStore();

  useEffect(() => {
    // First restore from localStorage
    initialize();

    // After restoring, if there's still no user, auto-create a guest punter
    const stored = localStorage.getItem('user');
    if (!stored) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/auth/guest`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            setTokens(data.accessToken, data.refreshToken, data.user);
          }
        } catch (err) {
          console.error('Guest login failed:', err);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
