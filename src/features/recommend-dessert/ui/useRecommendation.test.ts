import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, delay, http } from "msw";
import { describe, expect, it } from "vitest";

import { captureRequests } from "@/_app/mocks/capture";
import { RECOMMEND_EVENTS, recommendChunks } from "@/_app/mocks/handlers";
import { server } from "@/_app/mocks/node";
import { chunkedStream } from "@/_app/mocks/stream";

import type { RecommendRequest } from "../model/types";
import { useRecommendation } from "./useRecommendation";

const request: RecommendRequest = { query: "달콤한 것", chips: [], locale: "ko" };

/** 한 줄에 JSON 하나인 추천 응답. 조각은 줄 경계와 상관없이 나뉩니다(공통 목업의 나누기). */
const stream = (chunks: string[]) => new HttpResponse(chunkedStream(chunks, 5));
const recommendWith = (resolver: Parameters<typeof http.post>[1]) =>
  server.use(http.post("/api/recommend", resolver));

const done = RECOMMEND_EVENTS[RECOMMEND_EVENTS.length - 1];

describe("useRecommendation", () => {
  it("스트림으로 받은 추천을 차례로 보여 주고 끝나면 done입니다", async () => {
    // 줄이 조각으로 나뉘어 와도 이어 붙여 읽습니다(기본 목업이 줄 중간에서 자른 조각을 보냄).
    const { calls, capture } = captureRequests();
    recommendWith(async ({ request: sent }) => {
      await capture(sent);
      return stream(recommendChunks());
    });
    const { result } = renderHook(() => useRecommendation());
    await act(() => result.current.recommend(request));
    expect(result.current).toMatchObject({
      status: "done",
      intro: done?.intro,
      picks: done?.picks,
      source: "ai",
    });
    expect(calls[0]).toMatchObject({
      path: "/api/recommend",
      method: "POST",
      contentType: "application/json",
    });
    expect(JSON.parse(calls[0]?.body ?? "")).toEqual(request);
  });

  it("요청 한도(429)에 걸리면 limited입니다", async () => {
    recommendWith(() => new HttpResponse(null, { status: 429 }));
    const { result } = renderHook(() => useRecommendation());
    await act(() => result.current.recommend(request));
    expect(result.current.status).toBe("limited");
  });

  it.each([
    ["서버 오류(500)", () => new HttpResponse(null, { status: 500 })],
    ["네트워크 끊김", () => HttpResponse.error()],
    ["오류 이벤트", () => stream(['{"type":"error"}\n'])],
    ["끝나지 않은 스트림", () => stream([`${JSON.stringify(RECOMMEND_EVENTS[0])}\n`])],
  ])("%s이면 error입니다", async (_, answer) => {
    recommendWith(answer);
    const { result } = renderHook(() => useRecommendation());
    await act(() => result.current.recommend(request));
    expect(result.current.status).toBe("error");
  });
});

describe("useRecommendation 취소", () => {
  it("새로 요청하면 이전 요청을 취소하고, 취소된 요청은 오류로 보이지 않습니다", async () => {
    const signals: AbortSignal[] = [];
    recommendWith(async ({ request: sent }) => {
      signals.push(sent.signal);
      // 첫 요청은 끝나지 않는 응답(취소될 때까지 기다림)
      if (signals.length === 1) await delay("infinite");
      return stream([`${JSON.stringify(done)}\n`]);
    });
    const { result } = renderHook(() => useRecommendation());
    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.recommend(request);
    });
    await waitFor(() => expect(signals).toHaveLength(1));
    await act(() => result.current.recommend(request));
    await act(async () => first);
    expect(signals[0]?.aborted).toBe(true);
    expect(result.current.status).toBe("done");
  });

  it("화면에서 사라지면 진행 중인 요청을 취소합니다", async () => {
    const signals: AbortSignal[] = [];
    recommendWith(async ({ request: sent }) => {
      signals.push(sent.signal);
      await delay("infinite");
      return new HttpResponse(null);
    });
    const { result, unmount } = renderHook(() => useRecommendation());
    act(() => {
      void result.current.recommend(request);
    });
    await waitFor(() => expect(signals).toHaveLength(1));
    unmount();
    await waitFor(() => expect(signals[0]?.aborted).toBe(true));
  });
});
