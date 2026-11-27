import { loadHttp } from "@/shared/api";

import { parseOrderLookups, type StripeOrderLookup } from "../model/order-lookup";

/** 저장해 둔 결제 세션의 주문 정보를 서버에 묻습니다. Stripe가 꺼져 있거나 실패하면 null입니다. */
export async function lookupOrders(
  sessionIds: readonly string[],
): Promise<StripeOrderLookup[] | null> {
  if (sessionIds.length === 0) return [];
  try {
    const { http } = await loadHttp();
    // 2xx가 아니면 Wretch가 던지므로 아래 catch에서 null이 됩니다.
    const body: unknown = await http.url("/api/orders").json({ ids: sessionIds }).post().json();
    return parseOrderLookups(body);
  } catch {
    return null;
  }
}
