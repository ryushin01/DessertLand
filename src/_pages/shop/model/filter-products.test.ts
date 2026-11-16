import { describe, expect, it } from "vitest";

import { PRODUCTS, countryName, getProduct } from "@/entities/product";
import { productTastes } from "@/entities/product/index.server";
import messages from "@/shared/i18n/messages/ko.json";

import { NO_FILTERS, filterProducts, foldText, hasFilters } from "./filter-products";

const names = messages.products as Record<string, { name: string }>;
const words = {
  name: (slug: string) => names[slug]?.name ?? slug,
  country: (product: (typeof PRODUCTS)[number]) => countryName(product.country, "ko"),
  tastes: productTastes,
};
const slugs = (filters: Partial<typeof NO_FILTERS>) =>
  filterProducts(PRODUCTS, { ...NO_FILTERS, ...filters }, words).map(({ slug }) => slug);

describe("filterProducts", () => {
  it("조건이 없으면 모두 남깁니다", () => {
    expect(slugs({})).toHaveLength(PRODUCTS.length);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  it("이름·나라·영문 이름으로 찾고, 대소문자와 악센트를 무시합니다", () => {
    expect(slugs({ query: "티라미수" })).toEqual(["tiramisu"]);
    expect(slugs({ query: "  TIRAMISU " })).toEqual(["tiramisu"]);
    const japan = slugs({ query: "일본" });
    expect(japan.length).toBeGreaterThan(3);
    expect(japan.every((slug) => getProduct(slug)?.country === "JP")).toBe(true);
    expect(foldText("Tiramisù")).toBe("tiramisu");
    // 브라우저 언어와 상관없이 같은 결과(튀르키예어의 I·ı·İ도 i로 맞춤)
    expect(foldText("VANILLA-MALT")).toBe("vanilla-malt");
    expect(foldText("IRMIK")).toBe(foldText("ırmık"));
    expect(foldText("İstanbul")).toBe("istanbul");
    // 영문 slug는 하이픈 그대로도, 띄어 써도 찾습니다.
    expect(slugs({ query: "new-york-cheesecake" })).toEqual(["new-york-cheesecake"]);
    expect(slugs({ query: "new york cheese" })).toEqual(["new-york-cheesecake"]);
    expect(slugs({ query: "없는 디저트" })).toEqual([]);
  });

  it("뺀 성분이 든 상품은 남기지 않습니다", () => {
    const result = filterProducts(PRODUCTS, { ...NO_FILTERS, excluded: ["nuts", "milk"] }, words);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(PRODUCTS.length);
    expect(
      result.some(({ allergens }) => allergens.includes("nuts") || allergens.includes("milk")),
    ).toBe(false);
  });

  it("고른 맛 중 하나라도 있는 상품만 남기고, 다른 조건과 함께 씁니다", () => {
    const coffee = slugs({ tastes: ["coffee"] });
    expect(coffee).toContain("tiramisu");
    expect(coffee.every((slug) => productTastes(slug).includes("coffee"))).toBe(true);
    const either = slugs({ tastes: ["coffee", "fruity"] });
    expect(either.length).toBeGreaterThan(coffee.length);
    expect(slugs({ tastes: ["coffee"], excluded: ["milk"], query: "에스프레소" })).toEqual([
      "espresso",
    ]);
    expect(hasFilters({ ...NO_FILTERS, tastes: ["coffee"] })).toBe(true);
  });
});
