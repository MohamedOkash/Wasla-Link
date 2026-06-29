import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Store } from '../types/store.types';

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'stores'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stores, loading, error };
};
