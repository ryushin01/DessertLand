import "server-only";

import Stripe from "stripe";

/** 실제 결제가 일어나지 않도록 테스트 키만 받습니다. 운영 키가 들어오면 꺼진 것으로 처리합니다. */
export function getStripeTestClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^(sk|rk)_test_/.test(key)) return null;
  return new Stripe(key);
}

export function isStripeEnabled(): boolean {
  return getStripeTestClient() !== null;
}
