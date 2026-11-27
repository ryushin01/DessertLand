import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./tunnel";

const DSN = "https://key@o1.ingest.sentry.io/42";
const envelope = (dsn: string) =>
  `${JSON.stringify({ event_id: "a", dsn })}\n{"type":"event"}\n{"message":"x"}`;
const post = (body: string, ip = "1.1.1.1") =>
  POST(
    new Request("https://site.test/api/monitoring", {
      method: "POST",
      body,
      headers: { "x-real-ip": ip },
    }),
  );

describe("Sentry 중계 경로", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", DSN);
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("이 사이트의 DSN이면 Sentry의 envelope 주소로 받은 바이트를 그대로 넘깁니다", async () => {
    const body = `${envelope(DSN)}\n{"message":"맛있어요"}`;
    const response = await post(body);
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://o1.ingest.sentry.io/api/42/envelope/?sentry_version=7&sentry_key=key",
    );
    expect(init?.method).toBe("POST");
    expect(new TextDecoder().decode(init?.body as Uint8Array)).toBe(body);
  });

  it("다른 프로젝트의 DSN이나 깨진 묶음은 넘기지 않습니다", async () => {
    expect((await post(envelope("https://key@o1.ingest.sentry.io/99"), "2.2.2.2")).status).toBe(
      400,
    );
    expect((await post(envelope("https://key@evil.example/42"), "2.2.2.2")).status).toBe(400);
    expect((await post("not json", "2.2.2.2")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("너무 큰 묶음은 거절합니다", async () => {
    expect((await post(envelope(DSN) + "x".repeat(300 * 1024), "3.3.3.3")).status).toBe(413);
  });

  it("글자 수가 아니라 바이트 수로 상한을 셉니다", async () => {
    // 한글은 한 글자에 3바이트라, 글자 수로는 상한 아래여도 바이트로는 넘습니다.
    const body = `${envelope(DSN)}\n${"가".repeat(100 * 1024)}`;
    expect(body.length).toBeLessThan(256 * 1024);
    expect((await post(body, "6.6.6.6")).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Content-Length 없이 흘려보내도 상한을 넘으면 읽기를 멈춥니다", async () => {
    let pulled = 0;
    const chunk = new Uint8Array(64 * 1024);
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(chunk);
      },
    });
    const response = await POST(
      new Request("https://site.test/api/monitoring", {
        method: "POST",
        body: stream,
        headers: { "x-real-ip": "7.7.7.7" },
        // @ts-expect-error Node의 fetch는 흘려보내는 본문에 duplex가 필요합니다.
        duplex: "half",
      }),
    );
    expect(response.status).toBe(413);
    // 끝없는 본문이어도 상한(256KB)을 조금 넘긴 곳에서 멈춥니다.
    expect(pulled).toBeLessThan(10);
  });

  it("DSN이 없는 배포에서는 경로가 없는 것처럼 답합니다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect((await post(envelope(DSN), "4.4.4.4")).status).toBe(404);
  });

  it("Sentry가 2xx가 아닌 상태(429 등)로 답하면 그 상태를 그대로 돌려줍니다", async () => {
    fetchMock.mockResolvedValue(new Response("slow down", { status: 429 }));
    expect((await post(envelope(DSN), "8.8.8.8")).status).toBe(429);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).get("content-type")).toBe("application/x-sentry-envelope");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("Sentry에 닿지 못하면 502로 답합니다", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    expect((await post(envelope(DSN), "5.5.5.5")).status).toBe(502);
  });
});
