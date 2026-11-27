import { renderHook, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/_app/mocks/node";

import { cartLinesAtom } from "@/entities/cart";
import { savedOrdersAtom, type SavedOrder } from "@/entities/order";

import { RECHECK_MS, useSettleStripeOrders } from "./useSettleStripeOrders";

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

/** 주문 조회(/api/orders)에 차례로 답합니다. 마지막 응답은 그 뒤로도 되풀이합니다. 받은 요청 수를 셉니다. */
function answerOrders(...bodies: { body: unknown; status?: number }[]) {
  const counter = { count: 0 };
  server.use(
    http.post("/api/orders", () => {
      const answer = bodies[Math.min(counter.count, bodies.length - 1)];
      counter.count += 1;
      return HttpResponse.json(answer?.body ?? {}, { status: answer?.status ?? 200 });
    }),
  );
  return counter;
}

describe("useSettleStripeOrders", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("완료 화면으로 돌아오지 못한 결제를 다음 방문 때 장바구니에 반영합니다", async () => {
    const counter = answerOrders({
      body: {
        status: "ok",
        orders: [
          { sessionId: PAID, state: "paid", purchased: ["baklava", "tiramisu"] },
          { sessionId: OPEN, state: "unavailable" },
          { sessionId: BUY, state: "paid", purchased: [] },
        ],
      },
    });
    const store = setup([stripeOrder(PAID), stripeOrder(OPEN), stripeOrder(BUY, "buy")]);

    await waitFor(() =>
      expect(store.get(cartLinesAtom)).toEqual([{ slug: "macaron", quantity: 1 }]),
    );
    const settled = store
      .get(savedOrdersAtom)
      .flatMap((order) => (order.kind === "stripe" && order.settled ? [order.sessionId] : []));
    // 잠시 조회하지 못한 주문은 반영됨으로 표시하지 않고 다음에 다시 확인합니다.
    expect(settled.sort()).toEqual([BUY, PAID].sort());
    expect(counter.count).toBe(1);
  });

  it("결제 전에 저장한 수량만큼만 빼, 반영이 늦어지는 사이 다시 담은 같은 상품은 남깁니다", async () => {
    answerOrders({
      body: {
        status: "ok",
        orders: [{ sessionId: PAID, state: "paid", purchased: ["baklava", "tiramisu"] }],
      },
    });
    // 바클라바 1개와 티라미수 1개를 산 뒤, 반영되기 전에 티라미수를 하나 더 담았습니다(장바구니의 티라미수 2개).
    const store = setup([
      {
        ...stripeOrder(PAID),
        items: [
          { slug: "baklava", quantity: 1 },
          { slug: "tiramisu", quantity: 1 },
        ],
      },
    ]);

    await waitFor(() =>
      expect(store.get(cartLinesAtom)).toEqual([
        { slug: "tiramisu", quantity: 1 },
        { slug: "macaron", quantity: 1 },
      ]),
    );
    expect(store.get(savedOrdersAtom)[0]).toMatchObject({ settled: true });
  });

  it("반영할 주문이 없거나 방금 확인했으면 묻지 않습니다", async () => {
    const counter = answerOrders({ body: { status: "ok", orders: [] } });
    setup([{ ...stripeOrder(PAID), settled: true }]);
    sessionStorage.setItem("dessert-land.orders-checked", String(Date.now()));
    setup([stripeOrder(OPEN)]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(counter.count).toBe(0);
  });

  it("서버가 조회하지 못하면 아무것도 바꾸지 않습니다", async () => {
    answerOrders({ body: { status: "disabled" }, status: 503 });
    const store = setup([stripeOrder(PAID)]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(store.get(cartLinesAtom)).toHaveLength(3);
    expect(store.get(savedOrdersAtom)[0]).toMatchObject({ settled: false });
  });

  it("결과가 정해지지 않은 주문은 재확인 간격이 지나면 같은 화면에서 다시 묻습니다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const counter = answerOrders(
        { body: { status: "ok", orders: [{ sessionId: PAID, state: "open" }] } },
        {
          body: {
            status: "ok",
            orders: [{ sessionId: PAID, state: "paid", purchased: ["baklava"] }],
          },
        },
      );
      const store = setup([stripeOrder(PAID)]);

      await waitFor(() => expect(counter.count).toBe(1));
      expect(store.get(cartLinesAtom)).toHaveLength(3);

      await vi.advanceTimersByTimeAsync(RECHECK_MS + 1000);
      await waitFor(() => expect(counter.count).toBe(2));
      await waitFor(() =>
        expect(store.get(cartLinesAtom).map(({ slug }) => slug)).toEqual(["tiramisu", "macaron"]),
      );
      expect(store.get(savedOrdersAtom)[0]).toMatchObject({ settled: true });
    } finally {
      vi.useRealTimers();
    }
  });
});
