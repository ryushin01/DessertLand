import { act, render, screen, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/_app/mocks/node";

import { savedOrdersAtom, type SavedOrder } from "@/entities/order";
import messages from "@/shared/i18n/messages/ko.json";

import { OrdersView } from "./OrdersView";

vi.mock("@/shared/i18n", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));

const SESSION = "cs_test_paidpaidpaid01";

function renderOrders(orders: SavedOrder[]) {
  localStorage.setItem("dessert-land.orders", JSON.stringify(orders));
  const store = createStore();
  store.set(savedOrdersAtom, orders);
  render(
    <Provider store={store}>
      <NextIntlClientProvider locale="ko" messages={messages} timeZone="Asia/Seoul">
        <OrdersView />
      </NextIntlClientProvider>
    </Provider>,
  );
  return store;
}

/** 주문 조회(/api/orders)에 차례로 답합니다(마지막 응답은 되풀이). 받은 요청 수를 셉니다. */
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

describe("OrdersView", () => {
  beforeEach(() => localStorage.clear());

  it("주문이 없으면 안내합니다", () => {
    renderOrders([]);
    expect(screen.getByText("아직 주문이 없습니다.")).toBeInTheDocument();
  });

  it("테스트 결제 주문과 Stripe에서 조회한 주문을 보여 줍니다", async () => {
    answerOrders({
      body: {
        status: "ok",
        orders: [
          {
            sessionId: SESSION,
            state: "paid",
            orderNo: "DL-AID01XYZ",
            total: 15,
            currency: "USD",
            createdAt: Date.UTC(2026, 10, 15, 3, 0),
            purchased: [],
          },
        ],
      },
    });
    renderOrders([
      { kind: "stripe", sessionId: SESSION, createdAt: 1, source: "buy", settled: true },
      {
        kind: "demo",
        orderNo: "DL-DEMO0001",
        createdAt: Date.UTC(2026, 10, 14, 3, 0),
        total: 23100,
        locale: "ko",
        items: [{ slug: "baklava", quantity: 2 }],
      },
    ]);

    expect(screen.getByRole("heading", { level: 2, name: "DL-DEMO0001" })).toBeInTheDocument();
    expect(screen.getByText("테스트 결제")).toBeInTheDocument();
    expect(screen.getByText("₩23,100")).toBeInTheDocument();
    expect(screen.getByText("디저트 2개")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("주문 정보를 불러오는 중입니다.");

    // Stripe 주문은 서버가 조회한 번호·금액(그 주문의 통화)을 씁니다.
    expect(
      await screen.findByRole("heading", { level: 2, name: "DL-AID01XYZ" }),
    ).toBeInTheDocument();
    expect(screen.getByText("결제 완료")).toBeInTheDocument();
    expect(screen.getByText("US$15")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("조회에 실패하면 알리고, 저장한 날짜는 그대로 보여 줍니다", async () => {
    answerOrders({ body: {}, status: 503 });
    renderOrders([
      {
        kind: "stripe",
        sessionId: SESSION,
        createdAt: Date.UTC(2026, 10, 15),
        source: "cart",
        settled: false,
      },
    ]);
    expect(
      await screen.findByText("주문 정보를 불러오지 못했습니다. 잠시 후 다시 열어 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("확인할 수 없음")).toBeInTheDocument();
  });

  it("결과가 반영(settled)되면 같은 주문들이라도 다시 조회해 새 상태를 보여 줍니다", async () => {
    const counter = answerOrders(
      { body: { status: "ok", orders: [{ sessionId: SESSION, state: "open" }] } },
      {
        body: {
          status: "ok",
          orders: [
            {
              sessionId: SESSION,
              state: "paid",
              orderNo: "DL-AID01XYZ",
              total: 15,
              currency: "USD",
              createdAt: Date.UTC(2026, 10, 15, 3, 0),
              purchased: [],
            },
          ],
        },
      },
    );
    const order: SavedOrder = {
      kind: "stripe",
      sessionId: SESSION,
      createdAt: Date.UTC(2026, 10, 15),
      source: "cart",
      settled: false,
    };
    const store = renderOrders([order]);
    expect(await screen.findByText("결제 전")).toBeInTheDocument();

    act(() => store.set(savedOrdersAtom, [{ ...order, settled: true }]));
    await waitFor(() => expect(counter.count).toBe(2));
    expect(
      await screen.findByRole("heading", { level: 2, name: "DL-AID01XYZ" }),
    ).toBeInTheDocument();
  });
});
