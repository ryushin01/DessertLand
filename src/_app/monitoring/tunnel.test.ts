import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/_app/mocks/node";

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

type Received = { url: string; contentType: string | null; body: string; signal: AbortSignal };

/** Sentry envelope 주소의 목업. 받은 요청을 기록하고 정한 응답을 돌려줍니다. */
function sentryReceiver(answer: () => Response = () => new HttpResponse(null, { status: 200 })) {
  const received: Received[] = [];
  server.use(
    http.post("https://o1.ingest.sentry.io/api/:project/envelope/", async ({ request }) => {
      received.push({
        url: request.url,
        contentType: request.headers.get("content-type"),
        body: new TextDecoder().decode(await request.arrayBuffer()),
        signal: request.signal,
      });
      return answer();
    }),
  );
  return received;
}

describe("Sentry 중계 경로", () => {
  let received: Received[] = [];
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", DSN);
    received = sentryReceiver();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("이 사이트의 DSN이면 Sentry의 envelope 주소로 받은 바이트를 그대로 넘깁니다", async () => {
    const body = `${envelope(DSN)}\n{"message":"맛있어요"}`;
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(received).toHaveLength(1);
    expect(received[0]?.url).toBe(
      "https://o1.ingest.sentry.io/api/42/envelope/?sentry_version=7&sentry_key=key",
    );
    expect(received[0]?.body).toBe(body);
  });

  it("다른 프로젝트의 DSN이나 깨진 묶음은 넘기지 않습니다", async () => {
    expect((await post(envelope("https://key@o1.ingest.sentry.io/99"), "2.2.2.2")).status).toBe(
      400,
    );
    expect((await post(envelope("https://key@evil.example/42"), "2.2.2.2")).status).toBe(400);
    expect((await post("not json", "2.2.2.2")).status).toBe(400);
    expect(received).toEqual([]);
  });

  it("너무 큰 묶음은 거절합니다", async () => {
    expect((await post(envelope(DSN) + "x".repeat(300 * 1024), "3.3.3.3")).status).toBe(413);
  });

  it("글자 수가 아니라 바이트 수로 상한을 셉니다", async () => {
    // 한글은 한 글자에 3바이트라, 글자 수로는 상한 아래여도 바이트로는 넘습니다.
    const body = `${envelope(DSN)}\n${"가".repeat(100 * 1024)}`;
    expect(body.length).toBeLessThan(256 * 1024);
    expect((await post(body, "6.6.6.6")).status).toBe(413);
    expect(received).toEqual([]);
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
    received = sentryReceiver(() => new HttpResponse("slow down", { status: 429 }));
    expect((await post(envelope(DSN), "8.8.8.8")).status).toBe(429);
    expect(received[0]?.contentType).toBe("application/x-sentry-envelope");
    expect(received[0]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("Sentry에 닿지 못하면 502로 답합니다", async () => {
    sentryReceiver(() => HttpResponse.error());
    expect((await post(envelope(DSN), "5.5.5.5")).status).toBe(502);
  });
});
