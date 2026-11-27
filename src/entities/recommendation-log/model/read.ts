import { RECOMMENDATION_LOG_KEY, type RecommendationRecord } from "./log";

// 어드민이 읽는 쪽. 쇼핑몰은 기록을 더하기만 하므로(log.ts) 검사 코드를 쇼핑몰 번들에 싣지 않으려고 파일을 나눴습니다.
const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function isRecommendationRecord(value: unknown): value is RecommendationRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.at === "number" &&
    Number.isFinite(record.at) &&
    typeof record.locale === "string" &&
    isStringList(record.chips) &&
    typeof record.withQuery === "boolean" &&
    (record.source === "ai" || record.source === "basic") &&
    isStringList(record.picks)
  );
}

/** 저장된 기록(최신이 앞). 손댄 값은 버립니다. */
export function readRecommendationLog(): RecommendationRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECOMMENDATION_LOG_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isRecommendationRecord) : [];
  } catch {
    return [];
  }
}

export function clearRecommendationLog() {
  try {
    localStorage.removeItem(RECOMMENDATION_LOG_KEY);
  } catch {
    // 지울 수 없으면 그대로 둡니다.
  }
}
