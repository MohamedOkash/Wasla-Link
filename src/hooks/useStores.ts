import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Store } from '../types/store.types';
import { cacheService } from '../services/cache.service';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStores = async () => {
      try {
        const data = await cacheService.fetchWithCache<Store[]>(
          'stores_all',
          async () => {
            const q = query(collection(db, 'stores'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
          },
          CACHE_TTL_MS
        );
        if (mounted) {
          setStores(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStores();
    return () => { mounted = false; };
  }, []);

  return { stores, loading, error, setStores };
};
