import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import { cartLinesAtom, type CartLine } from "@/entities/cart/@x/order";

import type { SavedOrder } from "./saved-orders";
import { settleStripeOrdersAtom } from "./settle";

const ORDERS_KEY = "dessert-land.orders";
const CART_KEY = "dessert-land.cart";
const PAID = "cs_test_paidpaidpaid01";

const paidOrder: SavedOrder = {
  kind: "stripe",
  sessionId: PAID,
  createdAt: Date.UTC(2026, 10, 20),
  source: "cart",
  settled: false,
  items: [{ slug: "tiramisu", quantity: 1 }],
};

/** 머리글처럼 장바구니를 구독한 화면에서 반영합니다. 장바구니 atom은 구독해야 저장값을 읽습니다. */
function setup(orders: SavedOrder[], cart: CartLine[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const store = createStore();
  store.sub(cartLinesAtom, () => {});
  return store;
}

describe("Stripe 주문 결과 반영", () => {
  beforeEach(() => localStorage.clear());

  it("같은 주문을 두 번 반영해도(완료 화면과 다음 방문, 두 탭) 산 수량은 한 번만 뺍니다", () => {
    const store = setup([paidOrder], [{ slug: "tiramisu", quantity: 3 }]);
    const results = [{ sessionId: PAID, paid: true, purchased: ["tiramisu"] }];

    store.set(settleStripeOrdersAtom, results);
    store.set(settleStripeOrdersAtom, results);

    expect(store.get(cartLinesAtom)).toEqual([{ slug: "tiramisu", quantity: 2 }]);
    expect(JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]")).toMatchObject([
      { sessionId: PAID, settled: true },
    ]);
  });

  it("이 브라우저에 주문 기록이 없으면(저장 실패) 서버가 알려 준 상품 줄을 뺍니다", () => {
    const store = setup(
      [],
      [
        { slug: "tiramisu", quantity: 2 },
        { slug: "macaron", quantity: 1 },
      ],
    );

    store.set(settleStripeOrdersAtom, [{ sessionId: PAID, paid: true, purchased: ["tiramisu"] }]);

    expect(store.get(cartLinesAtom)).toEqual([{ slug: "macaron", quantity: 1 }]);
  });
});
