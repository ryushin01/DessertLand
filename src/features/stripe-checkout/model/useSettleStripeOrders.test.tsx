import { renderHook, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cartLinesAtom } from "@/entities/cart";
import { savedOrdersAtom, type SavedOrder } from "@/entities/order";

import { useSettleStripeOrders } from "./useSettleStripeOrders";

const PAID = "cs_test_paidpaidpaid01";
const OPEN = "cs_test_openopenopen01";
const BUY = "cs_test_buybuybuybuy01";

const stripeOrder = (
  sessionId: string,
  source: "cart" | "buy" = "cart",
): Extract<SavedOrder, { kind: "stripe" }> => ({
  kind: "stripe",
  sessionId,
  createdAt: Date.now() - 60_000,
  source,
  settled: false,
});

function setup(orders: SavedOrder[]) {
  const store = createStore();
  store.set(savedOrdersAtom, orders);
  store.set(cartLinesAtom, [
    { slug: "baklava", quantity: 1 },
    { slug: "tiramisu", quantity: 2 },
    { slug: "macaron", quantity: 1 },
  ]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  renderHook(() => useSettleStripeOrders(), { wrapper });
  return store;
}

describe("useSettleStripeOrders", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("완료 화면으로 돌아오지 못한 결제를 다음 방문 때 장바구니에 반영합니다", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        status: "ok",
        orders: [
          { sessionId: PAID, state: "paid", purchased: ["baklava", "tiramisu"] },
          { sessionId: OPEN, state: "open" },
          { sessionId: BUY, state: "paid", purchased: [] },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const store = setup([stripeOrder(PAID), stripeOrder(OPEN), stripeOrder(BUY, "buy")]);

    await waitFor(() =>
      expect(store.get(cartLinesAtom)).toEqual([{ slug: "macaron", quantity: 1 }]),
    );
    const settled = store
      .get(savedOrdersAtom)
      .flatMap((order) => (order.kind === "stripe" && order.settled ? [order.sessionId] : []));
    // 결제 전인 주문은 그대로 두고 다음에 다시 확인합니다.
    expect(settled.sort()).toEqual([BUY, PAID].sort());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("반영할 주문이 없거나 방금 확인했으면 묻지 않습니다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setup([{ ...stripeOrder(PAID), settled: true }]);
    sessionStorage.setItem("dessert-land.orders-checked", String(Date.now()));
    setup([stripeOrder(OPEN)]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("서버가 조회하지 못하면 아무것도 바꾸지 않습니다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ status: "disabled" }, { status: 503 })),
    );
    const store = setup([stripeOrder(PAID)]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(store.get(cartLinesAtom)).toHaveLength(3);
    expect(store.get(savedOrdersAtom)[0]).toMatchObject({ settled: false });
  });
});
