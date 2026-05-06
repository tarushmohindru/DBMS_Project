import { useState, useEffect } from 'react';
import { CreditWallet } from '@/types';
import api from '@/services/api';

export function useWallet(company_id: number | null | undefined) {
  const [wallet,  setWallet]  = useState<CreditWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!company_id) return;
    setLoading(true);
    api.get(`/wallet/${company_id}`)
      .then(res => setWallet(res.data.data))
      .catch(err => setError(err?.error || 'Failed to load wallet'))
      .finally(() => setLoading(false));
  }, [company_id]);

  const refetch = () => {
    if (!company_id) return;
    api.get(`/wallet/${company_id}`)
      .then(res => setWallet(res.data.data))
      .catch(() => {});
  };

  return { wallet, loading, error, refetch };
}
