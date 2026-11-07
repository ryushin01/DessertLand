import type { PaymentRequest, PaymentResult } from "../model/types";

const KNOWN = new Set(["approved", "declined", "amount_mismatch", "invalid"]);

export async function requestPayment(data: PaymentRequest): Promise<PaymentResult> {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = (await response.json()) as PaymentResult;
  if (!KNOWN.has(result.status)) throw new Error("알 수 없는 결제 응답입니다.");
  return result;
}
