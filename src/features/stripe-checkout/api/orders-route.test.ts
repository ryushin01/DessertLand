import { afterEach, describe, expect, it, vi } from "vitest";

const retrieve = vi.hoisted(() => vi.fn());
const enabled = vi.hoisted(() => ({ value: true }));
vi.mock("./stripe.server", () => ({
  getStripeTestClient: () => (enabled.value ? { checkout: { sessions: { retrieve } } } : null),
}));
vi.mock("server-only", () => ({}));

import { POST } from "./orders-route";
import { describeSession } from "./retrieve-order.server";

const ID = "cs_test_a1b2c3d4e5f6g7h8";
const session = (overrides: object) =>
  ({
    id: ID,
    status: "complete",
    payment_status: "paid",
    currency: "krw",
    amount_total: 22000,
    created: 1_763_000_000,
    metadata: { app: "dessert-land", source: "cart", items: "baklava,tiramisu" },
    ...overrides,
  }) as never;

const post = (body: unknown, ip = "1.1.1.1") =>
  POST(
    new Request("https://site.test/api/orders", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "x-real-ip": ip },
    }),
  );

afterEach(() => {
  retrieve.mockReset();
  enabled.value = true;
});

describe("describeSession", () => {
  it("결제된 이 사이트 세션은 번호·금액·산 상품을 돌려주고, 개인정보는 담지 않습니다", () => {
    const order = describeSession(
      session({ customer_details: { email: "a@example.com", name: "홍길동" } }),
    );
    expect(order).toEqual({
      sessionId: ID,
      state: "paid",
      orderNo: `DL-${ID.slice(-8).toUpperCase()}`,
      total: 22000,
      currency: "KRW",
      createdAt: 1_763_000_000_000,
      purchased: ["baklava", "tiramisu"],
    });
    expect(JSON.stringify(order)).not.toContain("example.com");
  });

  it("결제 전·만료·다른 프로젝트 세션을 구분합니다", () => {
    expect(describeSession(session({ status: "open", payment_status: "unpaid" })).state).toBe(
      "open",
    );
    expect(describeSession(session({ status: "expired", payment_status: "unpaid" })).state).toBe(
      "expired",
    );
    expect(describeSession(session({ metadata: { app: "other-shop" } })).state).toBe("unknown");
    // 바로 구매는 장바구니에서 뺄 것이 없습니다.
    expect(
      describeSession(session({ metadata: { source: "buy", items: "baklava" } })).purchased,
    ).toEqual([]);
  });
});

describe("POST /api/orders", () => {
  it("저장된 세션들을 조회하고, 없는 세션은 unknown, 잠시 조회하지 못한 세션은 unavailable로 돌려줍니다", async () => {
    const missing = "cs_test_zzzzzzzzzzzzzzzz";
    const flaky = "cs_test_yyyyyyyyyyyyyyyy";
    retrieve.mockImplementation(async (id: string) => {
      if (id === missing) {
        throw Object.assign(new Error("No such checkout.session"), {
          code: "resource_missing",
          statusCode: 404,
        });
      }
      if (id === flaky) throw Object.assign(new Error("connection reset"), { statusCode: 500 });
      return session({});
    });
    const response = await post({ ids: [ID, missing, flaky] });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = (await response.json()) as { orders: { sessionId: string; state: string }[] };
    expect(body.orders.map(({ sessionId, state }) => [sessionId, state])).toEqual([
      [ID, "paid"],
      [missing, "unknown"],
      [flaky, "unavailable"],
    ]);
  });

  it.each([
    ["빈 목록", { ids: [] }],
    ["세션 ID가 아님", { ids: ["cs_live_abcdefghijklmnop"] }],
    ["중복", { ids: [ID, ID] }],
    ["너무 많음", { ids: Array.from({ length: 21 }, (_, i) => `cs_test_${"a".repeat(10)}${i}`) }],
    ["모양이 다름", { ids: "cs_test_x" }],
  ])("잘못된 요청은 Stripe에 묻지 않고 거절합니다: %s", async (_name, body) => {
    expect((await post(body, "2.2.2.2")).status).toBe(400);
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("Stripe 키가 없으면 503입니다", async () => {
    enabled.value = false;
    expect((await post({ ids: [ID] }, "3.3.3.3")).status).toBe(503);
  });
});
