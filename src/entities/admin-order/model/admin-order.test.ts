import { describe, expect, it } from "vitest";

import { createSeedOrders, fromSavedOrder, priceLines } from "./build";
import { applyRefund, changeStatus } from "./operations";
import { dashboardStats } from "./stats";
import { mergeOrders } from "./store";
import { adminOrderSchema, refundableAmount, type AdminOrder } from "./types";

const NOW = new Date("2026-11-27T12:00:00").getTime();

const order = (patch: Partial<AdminOrder> = {}): AdminOrder => ({
  id: "DL-TEST",
  orderNo: "DL-TEST",
  createdAt: NOW - 1000,
  locale: "en",
  currency: "USD",
  channel: "test",
  origin: "seed",
  customer: "고객 #1",
  items: [{ slug: "baklava", quantity: 2, unitPrice: 7 }],
  shipping: 8,
  total: 22,
  totalUsd: 22,
  status: "paid",
  history: [{ status: "paid", at: NOW - 1000 }],
  refunds: [],
  ...patch,
});

describe("시드 주문", () => {
  it("같은 시각이면 늘 같은 주문을 만들고, 모두 저장 형식에 맞습니다", () => {
    const first = createSeedOrders(NOW);
    expect(createSeedOrders(NOW)).toEqual(first);
    expect(first).toHaveLength(72);
    for (const item of first) expect(adminOrderSchema.safeParse(item).success).toBe(true);
  });

  it("주문 금액은 쇼핑몰과 같은 통화 규칙으로 계산합니다", () => {
    expect(priceLines([{ slug: "baklava", quantity: 2 }], "en")).toMatchObject({
      total: 22,
      shipping: 8,
    });
  });
});

describe("쇼핑몰 주문 가져오기", () => {
  it("내장 테스트 결제 주문은 결제 금액 그대로, 결제 완료 상태로 가져옵니다", () => {
    const imported = fromSavedOrder({
      kind: "demo",
      orderNo: "DL-ABC",
      createdAt: NOW,
      total: 22,
      locale: "en",
      items: [{ slug: "baklava", quantity: 2 }],
    });
    expect(imported).toMatchObject({ id: "DL-ABC", total: 22, origin: "browser", status: "paid" });
  });

  it("이미 처리한 주문은 가져올 때 덮어쓰지 않습니다", () => {
    const shipped = order({ status: "shipped" });
    expect(mergeOrders([shipped], [order()])).toEqual([shipped]);
  });
});

describe("주문 처리", () => {
  it("정한 흐름으로만 단계를 바꿉니다", () => {
    expect(changeStatus(order(), "shipped", NOW)).toBe("not_allowed");
    expect(changeStatus(order(), "preparing", NOW)).toMatchObject({ status: "preparing" });
  });

  it("남은 금액까지만 환불하고, 전액이면 환불 완료가 됩니다", () => {
    const refund = { id: "rf", at: NOW, reason: "요청", method: "test" as const };
    expect(applyRefund(order(), { ...refund, amount: 30 })).toBe("invalid_amount");
    const partial = applyRefund(order(), { ...refund, amount: 10 });
    if (typeof partial === "string") throw new Error(partial);
    expect(partial.status).toBe("paid");
    expect(refundableAmount(partial)).toBe(12);
    expect(applyRefund(partial, { ...refund, id: "rf2", amount: 12 })).toMatchObject({
      status: "refunded",
    });
  });
});

describe("대시보드 통계", () => {
  it("취소를 빼고 환불액을 뺀 순매출과 인기 상품을 셉니다", () => {
    const stats = dashboardStats(
      [
        order(),
        order({ id: "B", status: "cancelled" }),
        order({ id: "C", refunds: [{ id: "r", amount: 11, at: NOW, reason: "", method: "test" }] }),
      ],
      NOW,
    );
    expect(stats.orders).toBe(2);
    expect(stats.revenueUsd).toBe(33);
    expect(stats.refundsUsd).toBe(11);
    expect(stats.top[0]).toMatchObject({ slug: "baklava", quantity: 4 });
    expect(stats.daily).toHaveLength(14);
  });
});
