import { describe, expect, it } from "vitest";

import { MAX_ORDER_LINES } from "@/entities/cart";
import { PRODUCTS } from "@/entities/product";

import { METADATA_VALUE_LIMIT, isOwnSession, packSlugs, unpackSlugs } from "./order-metadata";

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
    // app·source 키를 더해도 Stripe의 키 상한(50개) 안입니다.
    expect(Object.keys(packed).length + 2).toBeLessThanOrEqual(50);
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

  it("이 사이트가 만든 세션만 받습니다", () => {
    expect(isOwnSession({ app: "dessert-land", source: "cart" })).toBe(true);
    // 0.7.x까지의 세션은 app 표시 없이 source만 있습니다.
    expect(isOwnSession({ source: "buy", items: "baklava" })).toBe(true);
    expect(isOwnSession({ app: "other-shop", source: "cart" })).toBe(false);
    expect(isOwnSession({ order: "123" })).toBe(false);
    expect(isOwnSession(null)).toBe(false);
  });
});
