import { NextResponse } from "next/server";

import { clientKey, createRateLimiter } from "@/shared/lib/rate-limit";

import { MAX_LOOKUP, isSessionId } from "../model/order-lookup";
import { lookupStripeOrders } from "./retrieve-order.server";
import { getStripeTestClient } from "./stripe.server";

const limiter = createRateLimiter(20, 60_000);

/**
 * POST /api/orders { ids: string[] }
 * 이 브라우저가 저장해 둔 결제 세션의 주문 번호·금액·상태를 돌려줍니다. 이름·이메일·주소는 보내지 않습니다.
 * 세션 ID는 추측할 수 없는 값이라, 그 값을 가진 사람만 조회할 수 있습니다.
 */
export async function POST(request: Request) {
  const stripe = getStripeTestClient();
  if (!stripe) return NextResponse.json({ status: "disabled" }, { status: 503 });
  if (!limiter.take(clientKey(request.headers))) {
    return NextResponse.json({ status: "limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = body?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_LOOKUP ||
    !ids.every(isSessionId) ||
    new Set(ids).size !== ids.length
  ) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  const orders = await lookupStripeOrders(stripe, ids);
  return NextResponse.json({ status: "ok", orders }, { headers: { "cache-control": "no-store" } });
}
