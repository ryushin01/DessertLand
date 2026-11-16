import { parseOrderLookups, type StripeOrderLookup } from "../model/order-lookup";

/** 저장해 둔 결제 세션의 주문 정보를 서버에 묻습니다. Stripe가 꺼져 있거나 실패하면 null입니다. */
export async function lookupOrders(
  sessionIds: readonly string[],
): Promise<StripeOrderLookup[] | null> {
  if (sessionIds.length === 0) return [];
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: sessionIds }),
    });
    if (!response.ok) return null;
    return parseOrderLookups(await response.json());
  } catch {
    return null;
  }
}
