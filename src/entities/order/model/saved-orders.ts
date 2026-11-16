import type { CartLine } from "@/entities/cart/@x/order";

/**
 * 이 브라우저에서 한 주문. 배송 정보 같은 개인정보는 담지 않습니다.
 * - stripe: 결제 화면으로 가기 전에 세션 ID만 남기고, 주문 번호·금액은 서버가 Stripe에서 조회합니다.
 *   settled는 결제 결과를 장바구니에 반영했는지(산 상품을 뺐는지)입니다.
 * - demo: 키가 없을 때 쓰는 내장 테스트 결제. 서버에 남지 않으므로 주문 번호·금액·상품을 여기 둡니다.
 */
export type SavedOrder =
  | {
      kind: "stripe";
      sessionId: string;
      createdAt: number;
      source: "cart" | "buy";
      settled: boolean;
    }
  | {
      kind: "demo";
      orderNo: string;
      createdAt: number;
      total: number;
      locale: string;
      items: CartLine[];
    };

/** 오래된 주문부터 지워 저장 공간을 제한합니다. */
export const MAX_SAVED_ORDERS = 20;

/** Stripe 결제 세션은 24시간 뒤 만료되므로, 그보다 넉넉한 이 기간 안의 주문만 결과를 반영합니다. */
export const SETTLE_WINDOW_MS = 48 * 60 * 60 * 1000;

export const orderKey = (order: SavedOrder): string =>
  order.kind === "stripe" ? order.sessionId : order.orderNo;

/** 새 주문을 맨 앞에 더합니다. 같은 주문이 이미 있으면 바꿔 넣습니다. */
export function addSavedOrder(orders: readonly SavedOrder[], order: SavedOrder): SavedOrder[] {
  const key = orderKey(order);
  return [order, ...orders.filter((item) => orderKey(item) !== key)].slice(0, MAX_SAVED_ORDERS);
}

/** Stripe 주문의 결과를 장바구니에 반영했다고 표시합니다. */
export function settleOrders(
  orders: readonly SavedOrder[],
  sessionIds: readonly string[],
): SavedOrder[] {
  const ids = new Set(sessionIds);
  return orders.map((order) =>
    order.kind === "stripe" && ids.has(order.sessionId) && !order.settled
      ? { ...order, settled: true }
      : order,
  );
}

/** 결과를 아직 반영하지 않은, 기간 안의 Stripe 주문. */
export function pendingStripeOrders(
  orders: readonly SavedOrder[],
  now: number,
): Extract<SavedOrder, { kind: "stripe" }>[] {
  return orders.filter(
    (order): order is Extract<SavedOrder, { kind: "stripe" }> =>
      order.kind === "stripe" && !order.settled && now - order.createdAt < SETTLE_WINDOW_MS,
  );
}

/** 저장된 값이 모양에 맞는지 확인합니다. 다른 버전이 남긴 값이나 손댄 값은 버립니다. */
export function isSavedOrder(value: unknown): value is SavedOrder {
  const order = value as Partial<SavedOrder> | null;
  if (typeof order !== "object" || order === null || typeof order.createdAt !== "number")
    return false;
  if (order.kind === "stripe") {
    return (
      typeof order.sessionId === "string" &&
      (order.source === "cart" || order.source === "buy") &&
      typeof order.settled === "boolean"
    );
  }
  if (order.kind === "demo") {
    return (
      typeof order.orderNo === "string" &&
      typeof order.total === "number" &&
      typeof order.locale === "string" &&
      Array.isArray(order.items)
    );
  }
  return false;
}
