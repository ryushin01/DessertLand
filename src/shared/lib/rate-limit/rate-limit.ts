type Bucket = { count: number; resetAt: number };

export type RateLimiter = {
  /** 허용되면 true를 돌려주고 사용량을 하나 늘립니다. */
  take: (key: string, now?: number) => boolean;
};

const MAX_TRACKED_KEYS = 5000;

/**
 * 서버 인스턴스 메모리 기반의 고정 구간 제한입니다.
 * 인스턴스마다 따로 세므로 정확한 상한이 아니라 남용을 줄이는 1차 방어선입니다.
 */
export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, Bucket>();
  return {
    take(key, now = Date.now()) {
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        if (buckets.size >= MAX_TRACKED_KEYS) {
          for (const [storedKey, stored] of buckets) {
            if (stored.resetAt <= now) buckets.delete(storedKey);
          }
          // 만료된 항목이 없으면 가장 오래된 항목부터 지워 메모리를 제한합니다.
          if (buckets.size >= MAX_TRACKED_KEYS) {
            const oldest = buckets.keys().next().value;
            if (oldest !== undefined) buckets.delete(oldest);
          }
        }
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (bucket.count >= limit) return false;
      bucket.count += 1;
      return true;
    },
  };
}

/** Vercel이 설정하는 헤더를 우선합니다. 알 수 없으면 한 묶음으로 셉니다. */
export function clientKey(headers: Headers): string {
  return (
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}
