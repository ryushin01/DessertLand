/**
 * AI 추천 기록(공개 데모). 고객이 쓴 문장은 남기지 않고, 고른 맛 조건·추천 결과 상품·출처(AI/기본 추천)만 이 브라우저에 남깁니다.
 * 서버 로그에는 아무것도 남기지 않습니다(AGENTS.md 8절). 어드민 "AI 추천 기록" 화면이 읽습니다.
 */
export type RecommendationRecord = {
  at: number;
  locale: string;
  /** 고른 맛 칩(예: fruity, nutFree). */
  chips: string[];
  /** 문장을 함께 썼는지(문장 내용은 남기지 않음). */
  withQuery: boolean;
  source: "ai" | "basic";
  picks: string[];
};

export const RECOMMENDATION_LOG_KEY = "dessert-land.recommendations";
export const MAX_RECOMMENDATION_RECORDS = 50;

/**
 * 기록을 맨 앞에 더합니다. 저장 공간이 모자라도 추천 화면은 막지 않습니다.
 * 쇼핑몰 번들에 실리므로 여기서는 모양을 검사하지 않고, 읽는 쪽(readRecommendationLog)이 거릅니다.
 */
export function appendRecommendationRecord(record: RecommendationRecord) {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(RECOMMENDATION_LOG_KEY) ?? "[]");
    const next = [record, ...(Array.isArray(saved) ? saved : [])].slice(
      0,
      MAX_RECOMMENDATION_RECORDS,
    );
    localStorage.setItem(RECOMMENDATION_LOG_KEY, JSON.stringify(next));
  } catch {
    // 기록은 덤입니다.
  }
}
