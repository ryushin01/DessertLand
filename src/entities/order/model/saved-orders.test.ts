import { describe, expect, it } from "vitest";

import {
  MAX_SAVED_ORDERS,
  SETTLE_WINDOW_MS,
  addSavedOrder,
  isSavedOrder,
  pendingStripeOrders,
  settleOrders,
  type SavedOrder,
} from "./saved-orders";

const stripe = (sessionId: string, createdAt = 1000, settled = false): SavedOrder => ({
  kind: "stripe",
  sessionId,
  createdAt,
  source: "cart",
  settled,
});
const demo = (orderNo: string): SavedOrder => ({
  kind: "demo",
  orderNo,
  createdAt: 1000,
  total: 22,
  locale: "en",
  items: [{ slug: "baklava", quantity: 2 }],
});

describe("saved orders", () => {
  it("새 주문을 맨 앞에 더하고, 같은 주문은 바꿔 넣으며, 개수를 제한합니다", () => {
    const list = addSavedOrder(
      [stripe("cs_test_aaaaaaaaaa01"), demo("DL-1")],
      stripe("cs_test_aaaaaaaaaa01", 2000),
    );
    expect(list.map((order) => order.createdAt)).toEqual([2000, 1000]);
    const many = Array.from({ length: MAX_SAVED_ORDERS + 5 }, (_, index) =>
      demo(`DL-${index}`),
    ).reduce<SavedOrder[]>((orders, order) => addSavedOrder(orders, order), []);
    expect(many).toHaveLength(MAX_SAVED_ORDERS);
    expect(many[0]).toMatchObject({ orderNo: `DL-${MAX_SAVED_ORDERS + 4}` });
  });

  it("반영하지 않은 기간 안의 Stripe 주문만 고르고, 반영하면 표시합니다", () => {
    const now = 10 * SETTLE_WINDOW_MS;
    const orders = [
      stripe("cs_test_newnewnew01", now - 1000),
      stripe("cs_test_oldoldold01", now - SETTLE_WINDOW_MS - 1),
      stripe("cs_test_donedone01", now - 1000, true),
      demo("DL-1"),
    ];
    expect(pendingStripeOrders(orders, now).map((order) => order.sessionId)).toEqual([
      "cs_test_newnewnew01",
    ]);
    expect(pendingStripeOrders(settleOrders(orders, ["cs_test_newnewnew01"]), now)).toEqual([]);
  });

  it("모양이 다른 저장값은 버립니다", () => {
    expect(isSavedOrder(stripe("cs_test_aaaaaaaaaa01"))).toBe(true);
    expect(isSavedOrder(demo("DL-1"))).toBe(true);
    expect(isSavedOrder({ kind: "stripe", sessionId: 1, createdAt: 1 })).toBe(false);
    // 조회 API와 같은 규칙에 맞지 않는 세션 ID는 버립니다(섞이면 조회 묶음 전체가 거절됨).
    expect(isSavedOrder({ ...stripe("cs_test_aaaaaaaaaa01"), sessionId: "" })).toBe(false);
    expect(
      isSavedOrder({ ...stripe("cs_test_aaaaaaaaaa01"), sessionId: "cs_live_aaaaaaaaaa01" }),
    ).toBe(false);
    expect(isSavedOrder({ kind: "other", createdAt: 1 })).toBe(false);
    expect(isSavedOrder(null)).toBe(false);
    // 날짜로 나타낼 수 없는 시각은 주문 내역의 날짜 표시를 깨뜨립니다.
    expect(isSavedOrder({ ...demo("DL-1"), createdAt: 1e100 })).toBe(false);
    expect(isSavedOrder({ ...demo("DL-1"), createdAt: Number.NaN })).toBe(false);
    // 상품 줄이 하나라도 모양이 다르면 버립니다.
    expect(isSavedOrder({ ...demo("DL-1"), items: [null] })).toBe(false);
    expect(isSavedOrder({ ...demo("DL-1"), items: [{ slug: "baklava", quantity: 0 }] })).toBe(
      false,
    );
  });

  it("Stripe 주문은 결제 전에 저장한 상품 줄(수량)을 읽고, 상품 줄이 없는 예전 주문도 읽습니다", () => {
    const withItems = { ...stripe("cs_test_aaaaaaaaaa01"), items: [{ slug: "baklava", quantity: 2 }] };
    expect(isSavedOrder(withItems)).toBe(true);
    // 1.0.1까지 저장한 Stripe 주문에는 상품 줄이 없습니다.
    expect(isSavedOrder(stripe("cs_test_aaaaaaaaaa01"))).toBe(true);
    expect(isSavedOrder({ ...withItems, items: [{ slug: "baklava", quantity: 0 }] })).toBe(false);
    expect(isSavedOrder({ ...withItems, items: "baklava" })).toBe(false);
  });
});
