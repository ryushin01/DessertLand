import { pricingFor } from "@/entities/product";
import { loadHttp } from "@/shared/api";

import type { PaymentRequest, PaymentResult } from "../model/types";

const KNOWN = new Set(["approved", "declined", "amount_mismatch", "invalid"]);

export async function requestPayment(data: PaymentRequest): Promise<PaymentResult> {
  const { http, keepResponse } = await loadHttp();
  // 거절·금액 불일치 같은 결과도 본문으로 오므로, 상태 코드와 관계없이 응답 본문을 읽습니다.
  const response = await http
    .url("/api/payments")
    .json({ ...data, pricing: pricingFor() })
    .post()
    .res()
    .catch(keepResponse);
  const result = (await response.json()) as PaymentResult;
  if (!KNOWN.has(result.status)) throw new Error("알 수 없는 결제 응답입니다.");
  return result;
}
