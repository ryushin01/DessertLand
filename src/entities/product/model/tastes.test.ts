import { describe, expect, it } from "vitest";

import { PRODUCTS } from "./catalog";
import { TASTES } from "./taste-list";
import { TASTED_SLUGS, productTastes } from "./tastes";

describe("상품 맛 태그", () => {
  it("모든 상품에 맛 항목이 있고, 없는 상품의 맛은 없습니다", () => {
    const slugs = PRODUCTS.map(({ slug }) => slug);
    expect([...TASTED_SLUGS].sort()).toEqual([...slugs].sort());
  });

  it("정해 둔 맛만 씁니다", () => {
    for (const { slug } of PRODUCTS) {
      for (const taste of productTastes(slug)) expect(TASTES).toContain(taste);
    }
    expect(productTastes("tiramisu")).toEqual(["coffee", "creamy", "chocolate"]);
    expect(productTastes("nope")).toEqual([]);
  });
});
