import {
  NEXT_STATUSES,
  refundableAmount,
  type AdminOrder,
  type OrderStatus,
  type RefundRecord,
} from "./types";

export type OrderChangeError = "not_allowed" | "invalid_amount";

/** 단계를 바꿉니다. 정한 흐름(NEXT_STATUSES) 밖으로는 바꾸지 않습니다. */
export function changeStatus(
  order: AdminOrder,
  status: OrderStatus,
  at: number,
  note?: string,
): AdminOrder | OrderChangeError {
  if (!NEXT_STATUSES[order.status].includes(status)) return "not_allowed";
  return {
    ...order,
    status,
    history: [...order.history, { status, at, ...(note ? { note } : {}) }],
  };
}

/** 환불을 기록합니다. 남은 금액을 넘을 수 없고, 다 돌려주면 단계가 refunded로 바뀝니다. */
export function applyRefund(
  order: AdminOrder,
  refund: RefundRecord,
): AdminOrder | OrderChangeError {
  const remaining = refundableAmount(order);
  if (order.status === "refunded") return "not_allowed";
  if (!(refund.amount > 0) || refund.amount > remaining) return "invalid_amount";
  const refunds = [...order.refunds, refund];
  const full = refund.amount === remaining;
  return {
    ...order,
    refunds,
    ...(full
      ? {
          status: "refunded" as const,
          history: [
            ...order.history,
            { status: "refunded" as const, at: refund.at, note: refund.reason },
          ],
        }
      : {}),
  };
}
