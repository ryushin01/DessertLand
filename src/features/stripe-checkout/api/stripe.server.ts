import "server-only";

import Stripe from "stripe";

/**
 * Stripe가 끊겼을 때 기다리는 시간. SDK 기본값(80초, 다시 시도 2번)이면 결제 요청·완료 화면이 최대 4분 멈춥니다.
 * 짧게 끊어 결제 화면은 내장 테스트 결제로, 완료·주문 화면은 "확인할 수 없음" 안내로 바로 넘어가게 합니다.
 */
const STRIPE_OPTIONS = { timeout: 8_000, maxNetworkRetries: 1 } satisfies Stripe.StripeConfig;

/** 실제 결제가 일어나지 않도록 테스트 키만 받습니다. 운영 키가 들어오면 꺼진 것으로 처리합니다. */
export function getStripeTestClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^(sk|rk)_test_/.test(key)) return null;
  return new Stripe(key, STRIPE_OPTIONS);
}

export function isStripeEnabled(): boolean {
  return getStripeTestClient() !== null;
}
