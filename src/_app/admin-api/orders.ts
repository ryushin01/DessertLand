import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isRealAdminRequest } from "@/features/admin-auth/index.server";
import {
  getStripeTestClient,
  listStripeOrders,
  refundStripeSession,
} from "@/features/stripe-checkout/index.server";

/**
 * 어드민 주문 API(실제 인증 전용). 공개 데모에서는 어드민 화면의 MSW 워커가 시드 주문으로 대신 응답하고,
 * 워커를 거치지 않은 요청은 403입니다(공유 Stripe 샌드박스의 주문을 공개하지 않으려고).
 */
export async function GET(request: NextRequest) {
  if (!(await isRealAdminRequest(request)))
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  const stripe = getStripeTestClient();
  if (!stripe) return NextResponse.json({ status: "disabled", orders: [] }, { status: 200 });
  try {
    return NextResponse.json({ status: "ok", orders: await listStripeOrders(stripe) });
  } catch {
    return NextResponse.json({ status: "unavailable", orders: [] }, { status: 502 });
  }
}

const currency = z.enum(["USD", "KRW", "JPY", "CNY", "EUR", "TRY"]);
const refundSchema = z.discriminatedUnion("channel", [
  z.object({
    channel: z.literal("stripe"),
    sessionId: z.string().regex(/^cs_test_[A-Za-z0-9]{10,200}$/),
    amount: z.number().positive().max(10_000_000),
    currency,
  }),
  // 내장 테스트 결제 주문: 실제 결제가 없으므로 기록만 남깁니다.
  z.object({
    channel: z.literal("test"),
    sessionId: z.string().min(1).max(220),
    amount: z.number().positive().max(10_000_000),
    currency,
  }),
]);

/**
 * 환불(실제 인증만). Stripe 주문은 Stripe 테스트 모드 환불 API(테스트 키가 있을 때만), 내장 테스트 결제 주문은 기록만.
 * 금액은 주문 통화 단위입니다. 공개 데모는 어드민 화면의 MSW 워커가 대신 응답합니다.
 */
export async function refundPOST(request: NextRequest) {
  if (!(await isRealAdminRequest(request)))
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  const parsed = refundSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "invalid" }, { status: 400 });
  if (parsed.data.channel === "test") {
    return NextResponse.json({
      status: "refunded",
      id: `rf_test_${Date.now().toString(36)}`,
      method: "test",
    });
  }
  const stripe = getStripeTestClient();
  if (!stripe) return NextResponse.json({ status: "disabled" }, { status: 503 });
  const result = await refundStripeSession(
    stripe,
    parsed.data.sessionId,
    parsed.data.amount,
    parsed.data.currency,
  );
  return NextResponse.json(
    result.status === "refunded" ? { ...result, method: "stripe" } : result,
    { status: result.status === "refunded" ? 200 : 502 },
  );
}
