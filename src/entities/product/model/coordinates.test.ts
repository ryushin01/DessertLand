import { describe, expect, it } from "vitest";

import { PRODUCTS } from "./catalog";
import { COORDINATE_SLUGS, productCoordinates } from "./coordinates";

describe("상품 좌표", () => {
  it("모든 상품에 좌표가 있고(기타 나라는 빈 값), 없는 상품의 좌표는 없습니다", () => {
    for (const product of PRODUCTS) {
      const value = productCoordinates(product.slug);
      if (product.country === "XX") expect(value).toBe("");
      else expect(value).toMatch(/^\d+(\.\d+)?°[NS] \d+(\.\d+)?°[EW]$/);
    }
    expect(new Set(COORDINATE_SLUGS)).toEqual(new Set(PRODUCTS.map((product) => product.slug)));
  });
});
