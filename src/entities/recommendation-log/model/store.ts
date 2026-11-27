"use client";

import { useSyncExternalStore } from "react";

import { RECOMMENDATION_LOG_KEY, type RecommendationRecord } from "./log";
import { readRecommendationLog } from "./read";
import { createSeedRecommendations } from "./seed";

type Snapshot = { records: RecommendationRecord[]; local: number } | null;

let cache: { raw: string | null; withSeed: boolean; value: Snapshot } | null = null;

const subscribe = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === RECOMMENDATION_LOG_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
};

function read(withSeed: boolean): Snapshot {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(RECOMMENDATION_LOG_KEY);
  } catch {
    // 저장소를 못 쓰면 빈 기록입니다.
  }
  if (cache && cache.raw === raw && cache.withSeed === withSeed) return cache.value;
  const local = readRecommendationLog();
  const records = [...local, ...(withSeed ? createSeedRecommendations(Date.now()) : [])].sort(
    (a, b) => b.at - a.at,
  );
  cache = { raw, withSeed, value: { records, local: local.length } };
  return cache.value;
}

/** 추천 기록(최신이 앞). withSeed면 공개 데모 시드 기록을 더합니다. 서버 렌더링 중에는 null입니다. */
export function useRecommendationRecords(withSeed: boolean): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => read(withSeed),
    () => null,
  );
}
