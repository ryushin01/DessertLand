import type { AdminOrder, RefundRecord } from "@/entities/admin-order";
import { loadHttp } from "@/shared/api";
import { DEMO_MODE } from "@/shared/config";

/**
 * 환불하기. 실제 운영(데모 꺼짐)에서 Stripe에서 읽은 주문이면 서버가 Stripe 테스트 모드 환불 API를 부르고,
 * 그 밖(공개 데모, 내장 테스트 결제, 시드 주문)은 실제 결제가 없으므로 내장 테스트 결제 기록으로만 남깁니다.
 */
export async function requestRefund(
  order: AdminOrder,
  amount: number,
  reason: string,
  now = Date.now(),
): Promise<RefundRecord | "failed"> {
  if (!DEMO_MODE && order.origin === "stripe") {
    try {
      const { http, keepResponse } = await loadHttp();
      const response = await http
        .url("/api/admin/refunds")
        .json({ sessionId: order.id, amount, currency: order.currency })
        .post()
        .res()
        .catch(keepResponse);
      const result: unknown = await response.json();
      if (
        typeof result === "object" &&
        result !== null &&
        "status" in result &&
        result.status === "refunded" &&
        "id" in result &&
        typeof result.id === "string"
      ) {
        return { id: result.id, amount, at: now, reason, method: "stripe" };
      }
      return "failed";
    } catch {
      return "failed";
    }
  }
  return { id: `rf_test_${now.toString(36)}`, amount, at: now, reason, method: "test" };
}
