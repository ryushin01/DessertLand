import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RecommendRequest } from "../model/types";
import { useRecommendation } from "./useRecommendation";

const request: RecommendRequest = { query: "달콤한 것", chips: [], locale: "ko" };

const stream = (lines: string[]) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const line of lines) controller.enqueue(encoder.encode(line));
        controller.close();
      },
    }),
  );

const update = {
  type: "update",
  intro: "골라 봤어요",
  picks: [{ slug: "baklava", reason: "달아요" }],
};
const done = { ...update, type: "done", source: "ai" };

afterEach(() => vi.unstubAllGlobals());

describe("useRecommendation", () => {
  it("스트림으로 받은 추천을 차례로 보여 주고 끝나면 done입니다", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      // 줄이 조각으로 나뉘어 와도 이어 붙여 읽습니다.
      stream([
        `${JSON.stringify(update)}\n${JSON.stringify(done).slice(0, 10)}`,
        `${JSON.stringify(done).slice(10)}\n`,
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useRecommendation());
    await act(() => result.current.recommend(request));
    expect(result.current).toMatchObject({
      status: "done",
      intro: "골라 봤어요",
      picks: [{ slug: "baklava", reason: "달아요" }],
      source: "ai",
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/recommend");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual(request);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("요청 한도(429)에 걸리면 limited입니다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response(null, { status: 429 })),
    );
    const { result } = renderHook(() => useRecommendation());
    await act(() => result.current.recommend(request));
    expect(result.current.status).toBe("limited");
  });

  it.each([
    ["서버 오류(500)", () => Promise.resolve(new Response(null, { status: 500 }))],
    ["네트워크 끊김", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["오류 이벤트", () => Promise.resolve(stream(['{"type":"error"}\n']))],
    ["끝나지 않은 스트림", () => Promise.resolve(stream([`${JSON.stringify(update)}\n`]))],
  ])("%s이면 error입니다", async (_, answer) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(answer));
    const { result } = renderHook(() => useRecommendation());
    await act(() => result.current.recommend(request));
    expect(result.current.status).toBe("error");
  });
});

/** 실제 fetch처럼 취소 신호를 따르는(이미 취소됐으면 바로, 아니면 취소될 때 거절하는) 끝나지 않는 응답입니다. */
const hang = (signal: AbortSignal | null | undefined) =>
  new Promise<Response>((_resolve, reject) => {
    const abort = () => reject(new DOMException("aborted", "AbortError"));
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort);
  });

describe("useRecommendation 취소", () => {
  it("새로 요청하면 이전 요청을 취소하고, 취소된 요청은 오류로 보이지 않습니다", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>((_, init) => {
        const signal = init?.signal;
        if (signal) signals.push(signal);
        if (signals.length === 1) return hang(signal);
        return Promise.resolve(stream([`${JSON.stringify(done)}\n`]));
      }),
    );
    const { result } = renderHook(() => useRecommendation());
    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.recommend(request);
    });
    await act(() => result.current.recommend(request));
    await act(async () => first);
    expect(signals[0]?.aborted).toBe(true);
    expect(result.current.status).toBe("done");
  });

  it("화면에서 사라지면 진행 중인 요청을 취소합니다", async () => {
    const fetchMock = vi.fn<typeof fetch>((_, init) => hang(init?.signal));
    vi.stubGlobal("fetch", fetchMock);
    const { result, unmount } = renderHook(() => useRecommendation());
    act(() => {
      void result.current.recommend(request);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    unmount();
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});
