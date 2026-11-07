import { NextResponse } from "next/server";

import { clientKey, createRateLimiter } from "@/shared/lib/rate-limit";

import { confirmPayment } from "./confirmPayment";

const STATUS_CODES = { approved: 200, declined: 402, amount_mismatch: 409, invalid: 400 } as const;

const limiter = createRateLimiter(60, 60_000);

export async function POST(request: Request) {
  if (!limiter.take(clientKey(request.headers))) {
    return NextResponse.json({ status: "invalid" }, { status: 429 });
  }
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // 형식이 잘못된 본문은 아래 검증에서 거절합니다.
  }
  const result = confirmPayment(body);
  return NextResponse.json(result, { status: STATUS_CODES[result.status] });
}
