export function metricsCacheProxy<
  TCache extends {
    get: Function;
    mget?: Function;
    set: Function;
    del: Function;
  }
>(cache: TCache, perf: any) {
  return {
    async get<T>(key: string): Promise<T | null> {
      const value = await cache.get(key);
      value !== null ? perf.trackCacheHit() : perf.trackCacheMiss();
      return value as T | null;
    },

    async mget<T>(keys: string[]): Promise<(T | null)[]> {
      const res = await (cache.mget
        ? cache.mget(keys)
        : Promise.all(keys.map(k => cache.get(k))));

      let hit = 0;
      for (const v of res) {
        if (v !== null) hit++;
      }

      for (let i = 0; i < hit; i++) perf.trackCacheHit();
      for (let i = hit; i < keys.length; i++) perf.trackCacheMiss();

      return res as (T | null)[];
    },

    async set<T>(key: string, value: T, ttl: number) {
      return cache.set(key, value, ttl);
    },

    async del(keys: string | string[]) {
      return cache.del(keys);
    },
  };
}
