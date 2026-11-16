import { describe, expect, it } from "vitest";

import { PRODUCTS } from "@/entities/product";

import { MAX_ORDER_LINES, isValidOrderLines } from "./order";

const lines = (count: number) =>
  PRODUCTS.slice(0, count).map(({ slug }) => ({ slug, quantity: 1 }));

describe("isValidOrderLines", () => {
  it("상한까지는 받습니다", () => {
    expect(isValidOrderLines(lines(1))).toBe(true);
    expect(isValidOrderLines(lines(MAX_ORDER_LINES))).toBe(true);
  });

  it("상한을 넘는 종류 수는 거절합니다", () => {
    expect(PRODUCTS.length).toBeGreaterThan(MAX_ORDER_LINES);
    expect(isValidOrderLines(lines(MAX_ORDER_LINES + 1))).toBe(false);
  });

  it.each([
    ["배열 아님", null],
    ["빈 주문", []],
    ["없는 상품", [{ slug: "nope", quantity: 1 }]],
    ["0개", [{ slug: "baklava", quantity: 0 }]],
    ["소수 수량", [{ slug: "baklava", quantity: 1.5 }]],
    ["최대 초과", [{ slug: "baklava", quantity: 21 }]],
    [
      "중복 상품",
      [
        { slug: "baklava", quantity: 1 },
        { slug: "baklava", quantity: 1 },
      ],
    ],
  ])("잘못된 줄을 거절합니다: %s", (_name, items) => {
    expect(isValidOrderLines(items)).toBe(false);
  });
});
