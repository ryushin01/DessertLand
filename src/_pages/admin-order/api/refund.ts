import type { AdminOrder, RefundRecord } from "@/entities/admin-order";
import { loadHttp } from "@/shared/api";

/**
 * 환불하기. 서버(`POST /api/admin/refunds`)에 요청합니다.
 * - 실제 운영: Stripe에서 읽은 주문은 Stripe 테스트 모드 환불 API로 처리합니다(method: "stripe").
 * - 공개 데모: 어드민 화면의 MSW 워커가 내장 테스트 결제 기록으로 응답합니다(method: "test", 실제 돈이 오가지 않음).
 */
export async function requestRefund(
  order: AdminOrder,
  amount: number,
  reason: string,
  now = Date.now(),
): Promise<RefundRecord | "failed"> {
  try {
    const { http, keepResponse } = await loadHttp();
    const response = await http
      .url("/api/admin/refunds")
      .json({ sessionId: order.id, amount, currency: order.currency, channel: order.channel })
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
      const method = "method" in result && result.method === "stripe" ? "stripe" : "test";
      return { id: result.id, amount, at: now, reason, method };
    }
    return "failed";
  } catch {
    return "failed";
  }
}
