import { useState, useEffect, useCallback } from 'react';
import { MarketListing } from '@/types';
import api from '@/services/api';

export function useListings(active = true) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchListings = useCallback(() => {
    setLoading(true);
    const url = active ? '/listings' : '/listings/all';
    api.get(url)
      .then(res => setListings(res.data.data))
      .catch(err => setError(err?.error || 'Failed to load listings'))
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}
