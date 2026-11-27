import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isRealAdminRequest } from "@/features/admin-auth/index.server";
import {
  getStripeTestClient,
  listStripeOrders,
  refundStripeSession,
} from "@/features/stripe-checkout/index.server";

/**
 * 어드민 주문 API(데모가 꺼진 실제 인증 전용). 공개 데모에서는 시드·브라우저 주문만 쓰므로 이 API를 부르지 않고,
 * 불러도 403입니다(공유 Stripe 샌드박스의 주문을 공개하지 않으려고).
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

const refundSchema = z.object({
  sessionId: z.string().regex(/^cs_test_[A-Za-z0-9]{10,200}$/),
  amount: z.number().positive().max(10_000_000),
  currency: z.enum(["USD", "KRW", "JPY", "CNY", "EUR", "TRY"]),
});

/** Stripe 테스트 모드 환불(실제 인증 + 테스트 키가 있을 때만). 금액은 주문 통화 단위입니다. */
export async function refundPOST(request: NextRequest) {
  if (!(await isRealAdminRequest(request)))
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  const stripe = getStripeTestClient();
  if (!stripe) return NextResponse.json({ status: "disabled" }, { status: 503 });
  const parsed = refundSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "invalid" }, { status: 400 });
  const result = await refundStripeSession(
    stripe,
    parsed.data.sessionId,
    parsed.data.amount,
    parsed.data.currency,
  );
  return NextResponse.json(result, { status: result.status === "refunded" ? 200 : 502 });
}
