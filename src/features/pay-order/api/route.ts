import { NextResponse } from "next/server";

import { confirmPayment } from "./confirmPayment";

const STATUS_CODES = { approved: 200, declined: 402, amount_mismatch: 409, invalid: 400 } as const;

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // 형식이 잘못된 본문은 아래 검증에서 거절합니다.
  }
  const result = confirmPayment(body);
  return NextResponse.json(result, { status: STATUS_CODES[result.status] });
}
