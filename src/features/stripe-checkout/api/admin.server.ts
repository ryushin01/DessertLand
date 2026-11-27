import "server-only";

import type Stripe from "stripe";

import { priceLines, type AdminOrder } from "@/entities/admin-order/index.server";
import type { Currency } from "@/entities/product";

import { describeSession } from "./retrieve-order.server";
import { toMinorUnits } from "./minor-units";
import { unpackSlugs } from "./order-metadata";

/**
 * 어드민(데모가 꺼진 실제 인증)에서 읽는 Stripe 테스트 모드 주문. 이름·이메일·주소는 읽지 않고 돌려주지도 않습니다.
 * 수량은 세션 메타데이터에 없어 1개로 보고, 금액은 Stripe가 실제로 받은 금액을 씁니다.
 */
export async function listStripeOrders(stripe: Stripe, limit = 100): Promise<AdminOrder[]> {
  const sessions = await stripe.checkout.sessions.list({ limit, status: "complete" });
  return sessions.data.flatMap((session) => {
    const order = describeSession(session);
    if (order.state !== "paid" || !order.currency) return [];
    const slugs = unpackSlugs(session.metadata);
    const priced = priceLines(
      slugs.map((slug) => ({ slug, quantity: 1 })),
      session.locale === "ko" ? "ko" : "en",
    );
    if (priced.items.length === 0) return [];
    return [
      {
        ...priced,
        id: session.id,
        orderNo: order.orderNo ?? session.id,
        createdAt: order.createdAt ?? session.created * 1000,
        locale: session.locale ?? "en",
        currency: order.currency,
        total: order.total ?? priced.total,
        channel: "stripe" as const,
        origin: "stripe" as const,
        customer: `Stripe 고객 ${session.id.slice(-4)}`,
        status: "paid" as const,
        history: [{ status: "paid" as const, at: order.createdAt ?? session.created * 1000 }],
        refunds: [],
      },
    ];
  });
}

export type StripeRefundResult = { status: "refunded"; id: string } | { status: "failed" };

/** Stripe 테스트 모드 환불. 테스트 키만 받는 클라이언트(getStripeTestClient)로만 부릅니다. */
export async function refundStripeSession(
  stripe: Stripe,
  sessionId: string,
  amount: number,
  currency: Currency,
): Promise<StripeRefundResult> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!paymentIntent || describeSession(session).state !== "paid") return { status: "failed" };
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      amount: toMinorUnits(amount, currency),
      metadata: { app: "dessert-land" },
    });
    return { status: "refunded", id: refund.id };
  } catch {
    return { status: "failed" };
  }
}
