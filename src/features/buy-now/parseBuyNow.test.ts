import { describe, expect, it } from "vitest";

import { parseBuyNow } from "./parseBuyNow";

describe("parseBuyNow", () => {
  it("상품과 수량을 읽습니다", () => {
    expect(parseBuyNow("baklava", "3")).toEqual({ slug: "baklava", quantity: 3 });
  });

  it("없는 상품이나 잘못된 값은 무시합니다", () => {
    expect(parseBuyNow("unknown", "1")).toBeUndefined();
    expect(parseBuyNow(undefined, "1")).toBeUndefined();
    expect(parseBuyNow(["baklava"], "1")).toBeUndefined();
  });

  it("수량을 허용 범위로 맞춥니다", () => {
    expect(parseBuyNow("baklava", "abc")?.quantity).toBe(1);
    expect(parseBuyNow("baklava", "-2")?.quantity).toBe(1);
    expect(parseBuyNow("baklava", "999")?.quantity).toBe(20);
  });
});
