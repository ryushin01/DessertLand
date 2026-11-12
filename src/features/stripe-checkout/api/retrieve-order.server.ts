import "server-only";

import { currencyForLocale } from "@/entities/product";

import { fromMinorUnits } from "./minor-units";
import { getStripeTestClient } from "./stripe.server";

/** purchased: 장바구니 주문이면 장바구니에서 뺄 상품의 slug, 바로 구매면 빈 배열입니다. */
export type PaidStripeOrder = { orderNo: string; total: number; purchased: string[] };

/** 주소의 세션 ID를 믿지 않고 Stripe에 결제 상태를 직접 확인합니다. */
export async function retrievePaidOrder(
  sessionId: string,
  locale: string,
): Promise<PaidStripeOrder | null> {
  const stripe = getStripeTestClient();
  if (!stripe || !sessionId.startsWith("cs_test_")) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const currency = currencyForLocale(locale);
    if (session.payment_status !== "paid" || session.currency?.toUpperCase() !== currency) {
      return null;
    }
    return {
      orderNo: `DL-${session.id.slice(-8).toUpperCase()}`,
      total: fromMinorUnits(session.amount_total ?? 0, currency),
      purchased:
        session.metadata?.source === "cart"
          ? (session.metadata.items ?? "").split(",").filter(Boolean)
          : [],
    };
  } catch {
    return null;
  }
}
