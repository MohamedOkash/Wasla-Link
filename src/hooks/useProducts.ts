import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product } from '../types/product.types';
import { cacheService } from '../services/cache.service';

const CACHE_TTL_MS = 1 * 60 * 1000; // 1 minute

export const useProducts = (storeId?: string, limitCount: number = 20) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const cacheKey = storeId ? `products_store_${storeId}_${refetchTrigger}` : `products_all_initial_${refetchTrigger}`;
        
        const data = await cacheService.fetchWithCache<{ items: Product[], lastDocId: string | null }>(
          cacheKey,
          async () => {
            let q = storeId 
              ? query(collection(db, 'products'), where('shopId', '==', storeId), limit(limitCount))
              : query(collection(db, 'products'), limit(limitCount));
              
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            const last = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
            
            if (mounted) setLastDoc(last);
            if (mounted && snapshot.docs.length < limitCount) setHasMore(false);
            else if (mounted) setHasMore(true);
            
            return { items, lastDocId: last?.id || null };
          },
          refetchTrigger > 0 ? 0 : CACHE_TTL_MS // bypass cache on manual refetch
        );
        
        if (mounted) {
          setProducts(data.items);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitial();
    return () => { mounted = false; };
  }, [storeId, limitCount, refetchTrigger]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;
    
    setLoading(true);
    try {
      let q = storeId 
        ? query(collection(db, 'products'), where('shopId', '==', storeId), startAfter(lastDoc), limit(limitCount))
        : query(collection(db, 'products'), startAfter(lastDoc), limit(limitCount));
        
      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      if (newItems.length > 0) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      if (snapshot.docs.length < limitCount) {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, lastDoc, storeId, limitCount]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return { products, loading, error, loadMore, hasMore, refetch };
};
