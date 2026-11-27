import { describe, expect, it } from "vitest";

import { getProduct } from "./catalog";
import {
  applyOverride,
  applyOverrides,
  demoPricing,
  parseCatalogOverrides,
  salePriceUsd,
} from "./overrides";

const baklava = getProduct("baklava");

describe("어드민 수정값", () => {
  it("모양이 맞는 칸만 남기고 범위를 벗어난 값·모르는 성분은 버립니다", () => {
    const parsed = parseCatalogOverrides({
      baklava: {
        hidden: true,
        priceUsd: 9999,
        discount: 20,
        stock: 3.7,
        name: { ko: "새 이름", en: 3 },
        allergens: ["milk", "glass"],
        tastes: "sweet",
      },
      broken: "x",
    });
    expect(parsed).toEqual({
      baklava: {
        hidden: true,
        priceUsd: undefined,
        discount: 20,
        stock: 3,
        name: { ko: "새 이름" },
        description: undefined,
        allergens: ["milk"],
        tastes: undefined,
      },
    });
    expect(parseCatalogOverrides("nope")).toEqual({});
    expect(parseCatalogOverrides([1, 2])).toEqual({});
  });

  it("할인을 적용한 판매가와 원래 가격, 품절을 계산합니다", () => {
    if (!baklava) throw new Error("상품 없음");
    expect(salePriceUsd(baklava, { priceUsd: 10, discount: 15 })).toBe(8.5);
    expect(applyOverride(baklava, { priceUsd: 10, discount: 15, stock: 0 })).toMatchObject({
      priceUsd: 8.5,
      listPriceUsd: 10,
      soldOut: true,
    });
    expect(applyOverride(baklava, undefined)).toBe(baklava);
  });

  it("쇼핑몰 목록에서 숨긴 상품을 뺍니다", () => {
    if (!baklava) throw new Error("상품 없음");
    expect(applyOverrides([baklava], { baklava: { hidden: true } })).toEqual([]);
  });

  it("서버는 데모일 때만 요청의 가격 수정값을 받습니다", () => {
    expect(demoPricing({ baklava: { priceUsd: 5 } }, true)).toMatchObject({
      baklava: { priceUsd: 5 },
    });
    expect(demoPricing({ baklava: { priceUsd: 5 } }, false)).toEqual({});
  });
});
