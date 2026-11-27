import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  MAX_RECOMMENDATION_RECORDS,
  RECOMMENDATION_LOG_KEY,
  appendRecommendationRecord,
  clearRecommendationLog,
  createSeedRecommendations,
  readRecommendationLog,
  useRecommendationRecords,
  type RecommendationRecord,
} from "../index";

const record = (
  at: number,
  source: RecommendationRecord["source"] = "ai",
): RecommendationRecord => ({
  at,
  locale: "ko",
  chips: ["fruity"],
  withQuery: true,
  source,
  picks: ["tiramisu"],
});

describe("AI 추천 기록", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("새 기록을 맨 앞에 더하고, 최근 50건만 남깁니다", () => {
    for (let index = 0; index < MAX_RECOMMENDATION_RECORDS + 5; index += 1) {
      appendRecommendationRecord(record(index));
    }
    const saved = readRecommendationLog();
    expect(saved).toHaveLength(MAX_RECOMMENDATION_RECORDS);
    expect(saved[0]?.at).toBe(MAX_RECOMMENDATION_RECORDS + 4);
  });

  it("손댄 값과 깨진 JSON은 버리고 읽습니다", () => {
    localStorage.setItem(
      RECOMMENDATION_LOG_KEY,
      JSON.stringify([record(1), { at: "어제" }, null, { ...record(2), source: "x" }]),
    );
    expect(readRecommendationLog()).toEqual([record(1)]);
    localStorage.setItem(RECOMMENDATION_LOG_KEY, "{깨짐");
    expect(readRecommendationLog()).toEqual([]);
    appendRecommendationRecord(record(3));
    // 깨진 값 위에 더하려다 실패해도 추천 화면을 막지 않습니다.
    expect(() => appendRecommendationRecord(record(4))).not.toThrow();
  });

  it("지우면 비어 있습니다", () => {
    appendRecommendationRecord(record(1));
    clearRecommendationLog();
    expect(readRecommendationLog()).toEqual([]);
  });

  it("시드는 늘 같은 24건이고 고객 문장이 없습니다", () => {
    const seed = createSeedRecommendations(1_700_000_000_000);
    expect(seed).toHaveLength(24);
    expect(createSeedRecommendations(1_700_000_000_000)).toEqual(seed);
    expect(seed.every((item) => !("query" in item))).toBe(true);
  });

  it("화면용 기록은 최신이 앞이고, 시드를 더하면 이 브라우저 기록 수를 따로 알려 줍니다", () => {
    appendRecommendationRecord(record(Date.now() + 1000, "basic"));
    const { result } = renderHook(() => useRecommendationRecords(true));
    expect(result.current?.local).toBe(1);
    expect(result.current?.records).toHaveLength(25);
    expect(result.current?.records[0]?.source).toBe("basic");

    // 다른 탭에서 기록이 바뀌면 다시 읽습니다.
    act(() => {
      localStorage.setItem(RECOMMENDATION_LOG_KEY, "[]");
      window.dispatchEvent(new StorageEvent("storage", { key: RECOMMENDATION_LOG_KEY }));
    });
    expect(result.current?.local).toBe(0);
    expect(renderHook(() => useRecommendationRecords(false)).result.current?.records).toEqual([]);
  });
});
