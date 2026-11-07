import "server-only";

import { currencyForLocale } from "@/entities/product";

import { fromMinorUnits } from "./minor-units";
import { getStripeTestClient } from "./stripe.server";

export type PaidStripeOrder = { orderNo: string; total: number; clearCart: boolean };

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
      clearCart: session.metadata?.source === "cart",
    };
  } catch {
    return null;
  }
}
