import { z } from "zod";

/** 주문 처리 단계. 환불은 금액이 남아 있는 동안 어느 단계에서든 할 수 있고, 전액을 돌려주면 refunded가 됩니다. */
export const ORDER_STATUSES = [
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "결제 완료",
  preparing: "준비 중",
  shipped: "배송 중",
  delivered: "배송 완료",
  cancelled: "취소",
  refunded: "환불 완료",
};

/** 다음으로 넘길 수 있는 단계. 취소·환불 완료·배송 완료 뒤에는 단계를 바꾸지 않습니다. */
export const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  paid: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const lineSchema = z.object({
  slug: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(99),
  /** 주문 통화의 단가 */
  unitPrice: z.number().nonnegative(),
});

const refundSchema = z.object({
  id: z.string().min(1).max(80),
  amount: z.number().positive(),
  at: z.number(),
  reason: z.string().max(200),
  /** stripe: Stripe 테스트 모드 환불 API, test: 내장 테스트 결제 기록(실제 돈이 오가지 않음) */
  method: z.enum(["stripe", "test"]),
});

export const adminOrderSchema = z.object({
  id: z.string().min(1).max(220),
  orderNo: z.string().min(1).max(220),
  createdAt: z.number(),
  locale: z.string().min(2).max(5),
  currency: z.string().length(3),
  /** stripe: Stripe Checkout(테스트 모드), test: 내장 테스트 결제 */
  channel: z.enum(["stripe", "test"]),
  /** seed: 데모 시드, browser: 이 브라우저의 쇼핑몰에서 한 주문, stripe: Stripe에서 읽은 주문(데모가 꺼진 운영) */
  origin: z.enum(["seed", "browser", "stripe"]),
  /** 개인정보 대신 쓰는 익명 고객 표시 */
  customer: z.string().max(40),
  items: z.array(lineSchema).min(1).max(99),
  shipping: z.number().nonnegative(),
  total: z.number().nonnegative(),
  /** 대시보드 합산용 달러 환산 금액 */
  totalUsd: z.number().nonnegative(),
  status: z.enum(ORDER_STATUSES),
  history: z.array(
    z.object({
      status: z.enum(ORDER_STATUSES),
      at: z.number(),
      note: z.string().max(200).optional(),
    }),
  ),
  refunds: z.array(refundSchema),
});

export type AdminOrder = z.infer<typeof adminOrderSchema>;
export type OrderLine = AdminOrder["items"][number];
export type RefundRecord = AdminOrder["refunds"][number];

export const refundedAmount = (order: AdminOrder) =>
  order.refunds.reduce((sum, refund) => sum + refund.amount, 0);

/** 아직 돌려줄 수 있는 금액(주문 통화). */
export const refundableAmount = (order: AdminOrder) =>
  Math.max(0, Math.round((order.total - refundedAmount(order)) * 100) / 100);
