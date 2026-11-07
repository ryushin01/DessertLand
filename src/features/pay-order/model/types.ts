import type { CartLine } from "@/entities/cart";

export const PAYMENT_METHODS = ["card", "wallet", "bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** 테스트 결제창에서 고른 결과입니다. 실제 PG를 붙이면 PG의 결제 키로 바뀝니다. */
export type TestOutcome = "approve" | "decline";

/** 이름, 이메일, 주소 같은 개인정보는 보내지 않습니다. */
export type PaymentRequest = {
  items: CartLine[];
  method: PaymentMethod;
  locale: string;
  expectedTotal: number;
  outcome: TestOutcome;
};

export type PaymentResult =
  | { status: "approved"; orderNo: string; total: number }
  | { status: "declined" }
  | { status: "amount_mismatch"; total: number }
  | { status: "invalid" };
