import { describe, expect, it } from "vitest";

import { MAX_ORDER_LINES } from "@/entities/cart";
import { PRODUCTS } from "@/entities/product";

import { METADATA_VALUE_LIMIT, packSlugs, unpackSlugs } from "./order-metadata";

describe("order metadata", () => {
  it("500자 안이면 0.6.0까지와 같은 items 키 하나에 담습니다(이전 버전으로 되돌려도 읽힘)", () => {
    expect(packSlugs(["baklava", "tiramisu"])).toEqual({ items: "baklava,tiramisu" });
    expect(packSlugs([])).toEqual({});
  });

  it("가장 긴 slug로 상한까지 담아도 값마다 500자, 키 50개를 넘지 않고 그대로 되돌립니다", () => {
    const longest = PRODUCTS.map(({ slug }) => slug)
      .sort((a, b) => b.length - a.length)
      .slice(0, MAX_ORDER_LINES);
    const packed = packSlugs(longest);
    const values = Object.values(packed);
    expect(values.length).toBeGreaterThan(1);
    expect(Object.keys(packed).length + 1).toBeLessThanOrEqual(50);
    for (const value of values) expect(value.length).toBeLessThanOrEqual(METADATA_VALUE_LIMIT);
    expect(unpackSlugs({ source: "cart", ...packed })).toEqual(longest);
  });

  it("items 키 하나짜리도 읽습니다", () => {
    expect(unpackSlugs({ source: "cart", items: "baklava,tiramisu" })).toEqual([
      "baklava",
      "tiramisu",
    ]);
    expect(unpackSlugs(null)).toEqual([]);
  });
});
