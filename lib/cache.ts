interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// AtCoder Problems の静的データは1時間キャッシュ
export const PROBLEMS_TTL = 3600;
// ユーザー提出は5分キャッシュ（頻繁なリクエストを防ぐ）
export const SUBMISSIONS_TTL = 300;
// LeetCodeは10分キャッシュ
export const LEETCODE_TTL = 600;
