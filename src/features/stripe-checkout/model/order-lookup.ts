import { isSessionId } from "@/entities/order/index.server";

/**
 * 서버가 Stripe에서 조회한 주문의 상태.
 * paid 결제됨 · open 결제 중이거나 결제하지 않고 돌아옴(세션이 아직 유효) · expired 결제하지 않고 만료 ·
 * unknown 이 사이트 세션이 아니거나 없는 세션(끝난 결과) · unavailable 잠시 조회하지 못함(나중에 다시 물음)
 */
export type StripeOrderState = "paid" | "open" | "expired" | "unknown" | "unavailable";

/** 결과가 정해져 다시 묻지 않아도 되는 상태. 나머지(open, unavailable)는 나중에 다시 묻습니다. */
export const isSettledState = (state: StripeOrderState): boolean =>
  state === "paid" || state === "expired" || state === "unknown";

/** 개인정보(이름·이메일·주소)는 담지 않습니다. */
export type StripeOrderLookup = {
  sessionId: string;
  state: StripeOrderState;
  /** 결제됐을 때만 있습니다. */
  orderNo?: string;
  total?: number;
  currency?: string;
  createdAt?: number;
  /** 장바구니 주문이면 장바구니에서 뺄 상품의 slug, 바로 구매면 빈 배열입니다. */
  purchased?: string[];
};

/** 한 번에 조회할 수 있는 주문 수. 저장해 두는 주문 수와 같습니다. */
export const MAX_LOOKUP = 20;

/** 세션 ID 규칙은 저장한 주문(entities/order)과 같은 것을 씁니다. */
export { isSessionId };

const STATES = new Set<StripeOrderState>(["paid", "open", "expired", "unknown", "unavailable"]);

/** 응답의 모양을 확인합니다. 어긋난 항목은 버립니다. */
export function parseOrderLookups(value: unknown): StripeOrderLookup[] | null {
  const orders = (value as { orders?: unknown } | null)?.orders;
  if (!Array.isArray(orders)) return null;
  return orders.filter((item): item is StripeOrderLookup => {
    const order = item as Partial<StripeOrderLookup> | null;
    return (
      isSessionId(order?.sessionId) &&
      STATES.has(order.state as StripeOrderState) &&
      (order.purchased === undefined ||
        (Array.isArray(order.purchased) &&
          order.purchased.every((slug) => typeof slug === "string")))
    );
  });
}
