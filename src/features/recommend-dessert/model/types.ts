import { ALLERGENS, TASTES } from "@/entities/product";

/** 맛 고르기: 상품의 맛 태그(entities/product의 TASTES)에 "견과 빼고"를 더합니다. */
export const TASTE_CHIPS = [...TASTES, "nutFree"] as const;
export type TasteChip = (typeof TASTE_CHIPS)[number];

export const MAX_QUERY_LENGTH = 200;
export const MAX_PICKS = 3;

export type RecommendRequest = {
  query: string;
  chips: TasteChip[];
  locale: string;
};

export type Pick = { slug: string; reason: string };
export type Recommendation = { intro: string; picks: Pick[] };

/** 응답 본문은 한 줄에 JSON 하나씩 보냅니다. */
export type RecommendEvent =
  | ({ type: "update" } & Recommendation)
  | ({ type: "done"; source: "ai" | "basic" } & Recommendation)
  | { type: "error" };

export type RawRecommendation = {
  intro?: unknown;
  excludedAllergens?: unknown;
  picks?: unknown;
};

/** 추천이 다루는 알레르기 성분(상품 엔티티의 목록). */
export { ALLERGENS };
