// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { outageHandlers } from "@/_app/mocks/handlers";
import { server } from "@/_app/mocks/node";

import { parseRecommendEvent } from "../model/parse-event";
import type { RecommendEvent } from "../model/types";

vi.mock("server-only", () => ({}));
// 라우트 밖(Next 요청 설정 없이)에서 부르므로, 실제 메시지 파일로 만든 번역기를 돌려줍니다.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
      createTranslator({
        locale,
        namespace,
        messages: (await import(`@/shared/i18n/messages/${locale}.json`)).default,
      }),
  };
});

import { POST } from "./route";

let ip = 0;
const post = (body: unknown, address = `10.1.0.${(ip += 1)}`) =>
  POST(
    new NextRequest("https://site.test/api/recommend", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "x-real-ip": address },
    }),
  );

/** NDJSON 스트림을 끝까지 읽어 마지막 이벤트를 돌려줍니다. */
async function lastEvent(response: Response): Promise<RecommendEvent | null> {
  const lines = (await response.text()).trim().split("\n");
  return parseRecommendEvent(lines.at(-1) ?? "");
}

const request = { query: "커피랑 먹을 디저트", chips: [], locale: "ko" };

describe("추천 API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("API 키가 없으면 규칙 기반 기본 추천을 보냅니다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const event = await lastEvent(await post(request));
    expect(event).toMatchObject({ type: "done", source: "basic" });
    expect(event?.type === "done" && event.picks.length).toBeGreaterThan(0);
  });

  it("키가 있으면 Claude 스트림을 받아 AI 추천으로 끝냅니다(MSW 목업)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "msw-mock-key");
    const response = await post(request);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(await lastEvent(response)).toMatchObject({ type: "done", source: "ai" });
  });

  it("Claude가 끊기면 기본 추천으로 바꿉니다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "msw-mock-key");
    server.use(...outageHandlers);
    expect(await lastEvent(await post(request))).toMatchObject({ type: "done", source: "basic" });
  });

  it("형식이 틀리거나 지원하지 않는 언어는 400입니다", async () => {
    expect((await post({ query: "", chips: [], locale: "ko" })).status).toBe(400);
    expect((await post({ ...request, locale: "xx" })).status).toBe(400);
  });

  it("한 사람이 1분에 8번까지만 부를 수 있습니다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const statuses: number[] = [];
    for (let index = 0; index < 9; index += 1) {
      const response = await post(request, "10.2.0.1");
      statuses.push(response.status);
      await response.text();
    }
    expect(statuses.slice(0, 8).every((status) => status === 200)).toBe(true);
    expect(statuses[8]).toBe(429);
  });
});
