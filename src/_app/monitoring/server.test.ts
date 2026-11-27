import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { server } from "@/_app/mocks/node";

import { buildServerEvent, onRequestError } from "./server";

const request = {
  path: "/ko/checkout?buy=baklava#x",
  method: "GET",
  headers: { cookie: "secret" },
};
const context = {
  routerKind: "App Router",
  routePath: "/[locale]/checkout",
  routeType: "render",
  renderSource: "server-rendering",
  revalidateReason: undefined,
} as const;

describe("서버 오류 보고", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("쿼리·헤더 없이 오류 종류, 메시지, 스택, 경로를 담습니다", () => {
    const error = Object.assign(new Error("boom"), { digest: "123" });
    const event = buildServerEvent(error, request, context, "id");
    expect(event.request).toEqual({ method: "GET", url: "/ko/checkout" });
    expect(event.transaction).toBe("/[locale]/checkout");
    expect(event.exception.values[0]).toMatchObject({
      type: "Error",
      value: "boom",
      mechanism: { type: "onRequestError", handled: false },
    });
    expect(event.exception.values[0]?.stacktrace?.frames.length).toBeGreaterThan(0);
    expect(event.extra).toEqual({ digest: "123" });
    expect(JSON.stringify(event)).not.toContain("secret");
    expect(JSON.stringify(event)).not.toContain("buy=");
  });

  it("DSN이 있으면 envelope로 보내고, 없으면 보내지 않습니다", async () => {
    const received: { url: string; body: string }[] = [];
    server.use(
      http.post("https://o1.ingest.sentry.io/api/:project/envelope/", async ({ request }) => {
        received.push({ url: request.url, body: await request.text() });
        return new HttpResponse(null);
      }),
    );

    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    await onRequestError(new Error("a"), request, context);
    expect(received).toEqual([]);

    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://key@o1.ingest.sentry.io/42");
    await onRequestError(new Error("a"), request, context);
    expect(received[0]?.url).toBe(
      "https://o1.ingest.sentry.io/api/42/envelope/?sentry_version=7&sentry_key=key",
    );
    const lines = String(received[0]?.body).split("\n");
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[1] ?? "")).toEqual({ type: "event" });
  });

  it.each([
    ["네트워크 오류", () => HttpResponse.error()],
    ["2xx가 아닌 응답", () => new HttpResponse(null, { status: 503 })],
  ])("보내기에 실패해도(%s) 예외를 던지지 않습니다", async (_, answer) => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://key@o1.ingest.sentry.io/42");
    server.use(http.post("https://o1.ingest.sentry.io/api/:project/envelope/", answer));
    await expect(onRequestError(new Error("a"), request, context)).resolves.toBeUndefined();
  });
});
