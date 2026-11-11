import { describe, expect, it } from "vitest";

import { buildSessionParams, isSessionRequest, type SessionRequest } from "./build-session";
import { fromMinorUnits, toMinorUnits } from "./minor-units";

const request: SessionRequest = {
  items: [{ slug: "baklava", quantity: 2 }],
  locale: "en",
  expectedTotal: 22,
  source: "cart",
};
const build = (next: SessionRequest) =>
  buildSessionParams({
    request: next,
    origin: "https://example.test",
    productName: (slug) => `name:${slug}`,
    shippingName: "Shipping",
  });

describe("minor units", () => {
  it("소수 단위가 없는 통화를 구분합니다", () => {
    expect(toMinorUnits(9800, "KRW")).toBe(9800);
    expect(toMinorUnits(530, "JPY")).toBe(530);
    expect(toMinorUnits(8.5, "EUR")).toBe(850);
    expect(fromMinorUnits(850, "USD")).toBe(8.5);
    expect(fromMinorUnits(9800, "KRW")).toBe(9800);
  });
});

describe("buildSessionParams", () => {
  it("서버 가격과 배송비로 결제 항목을 만듭니다", () => {
    const params = build(request);
    expect(params?.line_items).toEqual([
      {
        quantity: 2,
        price_data: { currency: "usd", unit_amount: 700, product_data: { name: "name:baklava" } },
      },
      {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: 800, product_data: { name: "Shipping" } },
      },
    ]);
    expect(params?.metadata).toEqual({ source: "cart" });
    expect(params?.allowed_payment_method_types).toEqual(["card"]);
    expect(params?.adaptive_pricing).toEqual({ enabled: false });
    expect(params?.branding_settings).toEqual({ display_name: "Dessert Land" });
    expect(params?.success_url).toContain("/en/checkout/complete?session_id={CHECKOUT_SESSION_ID}");
  });

  it("원화는 소수 단위 없이 보냅니다", () => {
    const params = build({ ...request, locale: "ko", expectedTotal: 23100 });
    expect(params?.line_items?.[0]?.price_data?.currency).toBe("krw");
    expect(params?.line_items?.[0]?.price_data?.unit_amount).toBe(9800);
  });

  it("금액이 다르면 세션을 만들지 않습니다", () => {
    expect(build({ ...request, expectedTotal: 1 })).toBeNull();
  });

  it("바로 구매를 취소하면 같은 상품으로 돌아옵니다", () => {
    const params = build({ ...request, source: "buy" });
    expect(params?.cancel_url).toBe(
      "https://example.test/en/checkout?buy=baklava&qty=2&canceled=1",
    );
  });
});

describe("isSessionRequest", () => {
  it("올바른 요청만 통과시킵니다", () => {
    expect(isSessionRequest(request)).toBe(true);
    expect(isSessionRequest(null)).toBe(false);
    expect(isSessionRequest({ ...request, items: [] })).toBe(false);
    expect(isSessionRequest({ ...request, locale: "xx" })).toBe(false);
    expect(isSessionRequest({ ...request, source: "other" })).toBe(false);
    expect(isSessionRequest({ ...request, items: [{ slug: "baklava", quantity: 99 }] })).toBe(
      false,
    );
    expect(isSessionRequest({ ...request, items: [{ slug: "nope", quantity: 1 }] })).toBe(false);
  });
});
