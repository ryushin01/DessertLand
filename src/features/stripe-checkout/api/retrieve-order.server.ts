import "server-only";

import type Stripe from "stripe";

import { currencyForLocale, type Currency } from "@/entities/product";

import type { StripeOrderLookup } from "../model/order-lookup";
import { fromMinorUnits } from "./minor-units";
import { isOwnSession, unpackSlugs } from "./order-metadata";
import { getStripeTestClient } from "./stripe.server";

/** purchased: 장바구니 주문이면 장바구니에서 뺄 상품의 slug, 바로 구매면 빈 배열입니다. */
export type PaidStripeOrder = { orderNo: string; total: number; purchased: string[] };

const CURRENCIES = new Set<Currency>(["USD", "KRW", "JPY", "CNY", "EUR", "TRY"]);

/** 세션을 주문 정보로 바꿉니다. 이 사이트가 만든 세션이 아니면 unknown입니다. */
export function describeSession(session: Stripe.Checkout.Session): StripeOrderLookup {
  const base = { sessionId: session.id };
  if (!isOwnSession(session.metadata)) return { ...base, state: "unknown" };
  if (session.payment_status === "paid") {
    const currency = session.currency?.toUpperCase() as Currency | undefined;
    if (!currency || !CURRENCIES.has(currency)) return { ...base, state: "unknown" };
    return {
      ...base,
      state: "paid",
      orderNo: `DL-${session.id.slice(-8).toUpperCase()}`,
      total: fromMinorUnits(session.amount_total ?? 0, currency),
      currency,
      createdAt: session.created * 1000,
      purchased: session.metadata?.source === "cart" ? unpackSlugs(session.metadata) : [],
    };
  }
  return { ...base, state: session.status === "expired" ? "expired" : "open" };
}

/** 주소의 세션 ID를 믿지 않고 Stripe에 결제 상태를 직접 확인합니다. */
export async function retrievePaidOrder(
  sessionId: string,
  locale: string,
): Promise<PaidStripeOrder | null> {
  const stripe = getStripeTestClient();
  if (!stripe || !sessionId.startsWith("cs_test_")) return null;
  try {
    const order = describeSession(await stripe.checkout.sessions.retrieve(sessionId));
    // 결제한 화면의 통화와 같아야 합니다(다른 언어 주소로 바꿔 열면 확인하지 않음).
    if (order.state !== "paid" || order.currency !== currencyForLocale(locale)) return null;
    return {
      orderNo: order.orderNo ?? "",
      total: order.total ?? 0,
      purchased: order.purchased ?? [],
    };
  } catch {
    return null;
  }
}

function isMissingSession(error: unknown): boolean {
  const failure = error as { code?: unknown; statusCode?: unknown } | null;
  return failure?.code === "resource_missing" || failure?.statusCode === 404;
}

/** 이 브라우저가 저장해 둔 세션들의 주문 정보를 Stripe에서 조회합니다. */
export async function lookupStripeOrders(
  stripe: Stripe,
  sessionIds: readonly string[],
): Promise<StripeOrderLookup[]> {
  return Promise.all(
    sessionIds.map(async (sessionId) => {
      try {
        return describeSession(await stripe.checkout.sessions.retrieve(sessionId));
      } catch (error) {
        // 없는 세션은 끝난 결과(unknown)이고, 네트워크·요청 제한·서버 오류는 나중에 다시 물을 수 있게 unavailable입니다.
        return { sessionId, state: isMissingSession(error) ? ("unknown" as const) : ("unavailable" as const) };
      }
    }),
  );
}
