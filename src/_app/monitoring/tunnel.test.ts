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

  it("이 사이트의 DSN이면 Sentry의 envelope 주소로 그대로 넘깁니다", async () => {
    const body = envelope(DSN);
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://o1.ingest.sentry.io/api/42/envelope/?sentry_version=7&sentry_key=key",
      expect.objectContaining({ method: "POST", body }),
    );
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

  it("DSN이 없는 배포에서는 경로가 없는 것처럼 답합니다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect((await post(envelope(DSN), "4.4.4.4")).status).toBe(404);
  });

  it("Sentry에 닿지 못하면 502로 답합니다", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    expect((await post(envelope(DSN), "5.5.5.5")).status).toBe(502);
  });
});
