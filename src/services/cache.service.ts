type CacheItem<T> = {
  data: T;
  timestamp: number;
};

class CacheService {
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    // 1. Check Cache
    try {
      const cachedString = localStorage.getItem(key);
      if (cachedString) {
        const cached: CacheItem<T> = JSON.parse(cachedString);
        if (Date.now() - cached.timestamp < ttlMs) {
          return cached.data;
        }
      }
    } catch (e) {
      console.warn('Cache read error', e);
    }

    // 2. Check in-flight requests (Deduplication)
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    // 3. Fetch & Cache
    const promise = fetchFn().then((data) => {
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {
        console.warn('Cache write error', e);
      }
      this.inFlightRequests.delete(key);
      return data;
    }).catch((error) => {
      this.inFlightRequests.delete(key);
      // Offline fallback: If network fails, serve stale cache if available
      try {
        const staleString = localStorage.getItem(key);
        if (staleString) {
          const stale: CacheItem<T> = JSON.parse(staleString);
          return stale.data;
        }
      } catch (e) {}
      throw error;
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  clearCache(keyPrefix: string) {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(keyPrefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const cacheService = new CacheService();
