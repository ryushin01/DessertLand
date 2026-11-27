// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { MOCK_RECOMMENDATION } from "@/_app/mocks/fixtures";

import type { Recommendation } from "../model/types";
import { streamRecommendation } from "./claude.server";

describe("Claude 추천 스트리밍(MSW 목업 SSE)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("조각으로 온 JSON을 이어 읽어 중간 결과를 여러 번 알리고 끝까지 쓸 수 있는 결과를 돌려줍니다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "msw-mock-key");
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const updates: Recommendation[] = [];
    const result = await streamRecommendation({
      request: { query: "커피랑 먹을 디저트", chips: [], locale: "ko" },
      system: "테스트",
      signal: new AbortController().signal,
      onUpdate: (next) => updates.push(next),
    });
    expect(updates.length).toBeGreaterThan(1);
    expect(result?.intro).toBe(MOCK_RECOMMENDATION.intro);
    expect(result?.picks.map((pick) => pick.slug)).toEqual(
      MOCK_RECOMMENDATION.picks.map((pick) => pick.slug),
    );
  });
});
