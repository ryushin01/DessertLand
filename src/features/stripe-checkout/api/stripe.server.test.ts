// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getStripeTestClient } from "./stripe.server";

describe("getStripeTestClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("키가 없거나 운영 키면 꺼진 것으로 봅니다", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(getStripeTestClient()).toBeNull();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_x");
    expect(getStripeTestClient()).toBeNull();
  });

  it("Stripe가 응답하지 않아도 결제·완료 화면이 오래 멈추지 않게 짧게 기다리고 한 번만 다시 시도합니다", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit");
    const stripe = getStripeTestClient();
    // SDK 기본값(80초, 다시 시도 2번)이면 최대 4분 동안 응답이 없습니다. 내장 테스트 결제로 바꾸기 전에 기다리는 시간을 줄입니다.
    expect(stripe?.getApiField("timeout")).toBeLessThanOrEqual(8_000);
    expect(stripe?.getMaxNetworkRetries()).toBe(1);
  });
});
