import { describe, expect, it } from "vitest";

import { confirmPayment } from "./confirmPayment";

const valid = {
  items: [{ slug: "baklava", quantity: 2 }],
  method: "card",
  locale: "en",
  expectedTotal: 22,
  outcome: "approve",
};

describe("confirmPayment", () => {
  it("금액이 맞으면 승인합니다", () => {
    expect(confirmPayment(valid, () => "DL-1")).toEqual({
      status: "approved",
      orderNo: "DL-1",
      total: 22,
    });
  });

  it("브라우저가 보낸 금액이 다르면 승인하지 않습니다", () => {
    expect(confirmPayment({ ...valid, expectedTotal: 1 })).toEqual({
      status: "amount_mismatch",
      total: 22,
    });
  });

  it("실패 결과를 돌려줍니다", () => {
    expect(confirmPayment({ ...valid, outcome: "decline" })).toEqual({ status: "declined" });
  });

  it.each([
    ["빈 값", null],
    ["빈 주문", { ...valid, items: [] }],
    ["없는 상품", { ...valid, items: [{ slug: "nope", quantity: 1 }] }],
    ["0개", { ...valid, items: [{ slug: "baklava", quantity: 0 }] }],
    ["소수 수량", { ...valid, items: [{ slug: "baklava", quantity: 1.5 }] }],
    ["최대 초과", { ...valid, items: [{ slug: "baklava", quantity: 21 }] }],
    ["중복 상품", { ...valid, items: [{ slug: "baklava", quantity: 1 }, { slug: "baklava", quantity: 1 }] }],
    ["없는 결제 수단", { ...valid, method: "cash" }],
    ["없는 언어", { ...valid, locale: "xx" }],
    ["없는 결과", { ...valid, outcome: "maybe" }],
  ])("잘못된 요청을 거절합니다: %s", (_name, body) => {
    expect(confirmPayment(body)).toEqual({ status: "invalid" });
  });
});
