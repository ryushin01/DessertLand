import { isValidOrderLines, summarizeCart } from "@/entities/cart";
import { demoPricing } from "@/entities/product/index.server";
import { DEMO_MODE } from "@/shared/config";
import { LOCALES } from "@/shared/i18n/index.server";

import { PAYMENT_METHODS, type PaymentRequest, type PaymentResult } from "../model/types";

function isValidRequest(body: unknown): body is PaymentRequest {
  const request = body as Partial<PaymentRequest> | null;
  return (
    isValidOrderLines(request?.items) &&
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
  demo: boolean = DEMO_MODE,
): PaymentResult {
  if (!isValidRequest(body)) return { status: "invalid" };
  // 공개 데모에서는 어드민이 고친 가격으로 계산합니다(데모가 아니면 받은 가격은 무시).
  const { total } = summarizeCart(body.items, body.locale, demoPricing(body.pricing, demo));
  if (total !== body.expectedTotal) return { status: "amount_mismatch", total };
  if (body.outcome === "decline") return { status: "declined" };
  return { status: "approved", orderNo: createOrderNo(), total };
}
