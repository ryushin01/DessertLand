// @vitest-environment node
import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listStripeOrders, refundStripeSession } from "./admin.server";
import { buildSessionParams } from "./build-session";
import { describeSession } from "./retrieve-order.server";

// 실제 Stripe SDK가 보낸 요청을 MSW 목업(_app/mocks/handlers/stripe.ts)이 받습니다. 실제 결제·환불은 없습니다.
const stripe = new Stripe("sk_test_msw_mock");

async function createPaidSession() {
  const params = buildSessionParams({
    request: {
      items: [{ slug: "baklava", quantity: 2 }],
      locale: "ko",
      expectedTotal: 23100,
      source: "cart",
    },
    origin: "https://site.test",
    productName: () => "바클라바",
    shippingName: "배송비",
    demo: false,
  });
  if (!params) throw new Error("금액이 맞지 않습니다");
  return stripe.checkout.sessions.create(params);
}

describe("Stripe 테스트 모드(MSW 목업)", () => {
  it("결제 세션을 만들고, 다시 조회하면 이 사이트의 결제 완료 주문입니다", async () => {
    const session = await createPaidSession();
    expect(session.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    const order = describeSession(await stripe.checkout.sessions.retrieve(session.id));
    expect(order).toMatchObject({
      state: "paid",
      total: 23100,
      currency: "KRW",
      purchased: ["baklava"],
    });
  });

  it("어드민은 Stripe 세션을 주문으로 읽고, 테스트 모드 환불을 요청합니다", async () => {
    const session = await createPaidSession();
    const orders = await listStripeOrders(stripe);
    expect(orders.find((order) => order.id === session.id)).toMatchObject({
      origin: "stripe",
      channel: "stripe",
      total: 23100,
      currency: "KRW",
    });
    await expect(refundStripeSession(stripe, session.id, 23100, "KRW")).resolves.toMatchObject({
      status: "refunded",
    });
  });

  it("없는 세션은 환불하지 않습니다", async () => {
    await expect(
      refundStripeSession(stripe, "cs_test_nonenonenone01", 1000, "KRW"),
    ).resolves.toEqual({
      status: "failed",
    });
  });
});
