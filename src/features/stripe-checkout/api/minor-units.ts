import type { Currency } from "@/entities/product";

/** Stripe는 최소 단위 정수로 금액을 받습니다. 원과 엔은 소수 단위가 없습니다. */
const ZERO_DECIMAL = new Set<Currency>(["KRW", "JPY"]);

export function toMinorUnits(amount: number, currency: Currency): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100);
}

export function fromMinorUnits(minor: number, currency: Currency): number {
  return ZERO_DECIMAL.has(currency) ? minor : minor / 100;
}
