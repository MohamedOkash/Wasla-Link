import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Review } from '../contexts/AppContext';
import { cacheService } from '../services/cache.service';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const useReviews = (storeId?: string, productId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchReviews = async () => {
      try {
        let cacheKey = 'reviews_all';
        if (storeId) cacheKey = `reviews_store_${storeId}`;
        if (productId) cacheKey = `reviews_product_${productId}`;

        const data = await cacheService.fetchWithCache<Review[]>(
          cacheKey,
          async () => {
            let q = collection(db, 'reviews') as any;
            if (storeId) q = query(q, where('storeId', '==', storeId));
            if (productId) q = query(q, where('productId', '==', productId)); // Assuming products have reviews mapped
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Review));
          },
          CACHE_TTL_MS
        );

        if (mounted) {
          setReviews(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => { mounted = false; };
  }, [storeId, productId]);

  return { reviews, loading, error, setReviews };
};
