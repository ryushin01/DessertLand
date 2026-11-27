import { describe, expect, it } from "vitest";

import { summarizeCart } from "./summarize";

describe("summarizeCart", () => {
  it("수량과 배송비를 합산합니다", () => {
    const summary = summarizeCart([{ slug: "baklava", quantity: 2 }], "en");
    expect(summary.subtotal).toBe(14);
    expect(summary.shipping).toBe(8);
    expect(summary.total).toBe(22);
  });

  it("비어 있으면 배송비가 없습니다", () => {
    expect(summarizeCart([], "ko")).toEqual({ lines: [], subtotal: 0, shipping: 0, total: 0 });
  });

  it("없는 상품은 건너뜁니다", () => {
    expect(summarizeCart([{ slug: "unknown", quantity: 1 }], "ko").lines).toEqual([]);
  });
});

describe("summarizeCart — 어드민 수정값(공개 데모)", () => {
  it("할인한 판매가로 계산합니다", () => {
    const summary = summarizeCart([{ slug: "baklava", quantity: 2 }], "en", {
      baklava: { priceUsd: 10, discount: 50 },
    });
    expect(summary.subtotal).toBe(10);
  });

  it("숨긴 상품은 주문에서 뺍니다", () => {
    const summary = summarizeCart([{ slug: "baklava", quantity: 1 }], "en", {
      baklava: { hidden: true },
    });
    expect(summary.lines).toEqual([]);
    expect(summary.total).toBe(0);
  });
});
