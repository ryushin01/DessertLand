import { MAX_QUANTITY, type CartLine } from "@/entities/cart";
import { getProduct } from "@/entities/product";
import { summarizeCart } from "@/entities/cart";
import { LOCALES } from "@/shared/i18n/index.server";

import { PAYMENT_METHODS, type PaymentRequest, type PaymentResult } from "../model/types";

function isValidItem(item: unknown): item is CartLine {
  const line = item as Partial<CartLine> | null;
  return (
    typeof line?.slug === "string" &&
    getProduct(line.slug) !== undefined &&
    Number.isInteger(line.quantity) &&
    (line.quantity as number) >= 1 &&
    (line.quantity as number) <= MAX_QUANTITY
  );
}

function isValidRequest(body: unknown): body is PaymentRequest {
  const request = body as Partial<PaymentRequest> | null;
  return (
    Array.isArray(request?.items) &&
    request.items.length > 0 &&
    request.items.every(isValidItem) &&
    new Set(request.items.map((item) => item.slug)).size === request.items.length &&
    PAYMENT_METHODS.includes(request.method as never) &&
    LOCALES.includes(request.locale as never) &&
    typeof request.expectedTotal === "number" &&
    (request.outcome === "approve" || request.outcome === "decline")
  );
}

/**
 * 금액은 브라우저 값을 믿지 않고 서버의 카탈로그로 다시 계산합니다.
 * 실제 PG를 붙일 때는 outcome 분기를 PG 승인 요청으로 바꿉니다.
 */
export function confirmPayment(
  body: unknown,
  createOrderNo: () => string = () => `DL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
): PaymentResult {
  if (!isValidRequest(body)) return { status: "invalid" };
  const { total } = summarizeCart(body.items, body.locale);
  if (total !== body.expectedTotal) return { status: "amount_mismatch", total };
  if (body.outcome === "decline") return { status: "declined" };
  return { status: "approved", orderNo: createOrderNo(), total };
}
