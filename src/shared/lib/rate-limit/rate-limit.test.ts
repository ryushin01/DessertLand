import { describe, expect, it } from "vitest";

import { clientKey, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("구간 안에서 상한까지만 허용합니다", () => {
    const limiter = createRateLimiter(2, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("a", 10)).toBe(true);
    expect(limiter.take("a", 20)).toBe(false);
  });

  it("키를 따로 세고 구간이 지나면 다시 허용합니다", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("b", 0)).toBe(true);
    expect(limiter.take("a", 500)).toBe(false);
    expect(limiter.take("a", 1000)).toBe(true);
  });
});

describe("clientKey", () => {
  it("실제 IP 헤더를 우선합니다", () => {
    expect(clientKey(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe(
      "1.1.1.1",
    );
    expect(clientKey(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
