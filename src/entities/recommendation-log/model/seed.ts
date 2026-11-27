import type { RecommendationRecord } from "./log";

const CHIPS = ["fruity", "chocolate", "coffee", "nutty", "creamy", "light", "nutFree"] as const;
const LOCALES = ["ko", "ko", "ko", "en", "ja", "zh", "fr", "de", "es", "tr"] as const;
const PICKS = [
  "tiramisu",
  "mont-blanc",
  "macaron",
  "basque-cheesecake",
  "pastel-de-nata",
  "baklava",
  "strawberry-shortcake",
  "daifuku",
  "gelato",
  "mille-feuille",
  "cappuccino",
  "sachertorte",
] as const;

/**
 * 공개 데모의 AI 추천 기록 시드(24건). 고객 문장은 원래 남기지 않으므로 시드에도 없습니다.
 * 같은 결과가 나오도록 간단한 선형 합동 수열을 씁니다.
 */
export function createSeedRecommendations(now: number, count = 24): RecommendationRecord[] {
  let state = 7;
  const next = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)] as T;
  return Array.from({ length: count }, (_, index) => {
    const chips = [...new Set([pick(CHIPS), ...(next() < 0.5 ? [pick(CHIPS)] : [])])];
    const picks = [...new Set([pick(PICKS), pick(PICKS), pick(PICKS)])];
    return {
      at: now - index * 5.5 * 60 * 60 * 1000 - Math.floor(next() * 3_600_000),
      locale: pick(LOCALES),
      chips,
      withQuery: next() < 0.4,
      // 공개 데모에는 Claude API 키가 없어 대부분 규칙 기반 기본 추천입니다.
      source: next() < 0.25 ? "ai" : "basic",
      picks,
    };
  });
}
