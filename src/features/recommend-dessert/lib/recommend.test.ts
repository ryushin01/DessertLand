import { describe, expect, it } from "vitest";

import { getProduct } from "@/entities/product";

import {
  isRecommendRequest,
  recommendLocally,
  requiredExclusions,
  sanitizeRecommendation,
} from "./recommend";

const words = {
  productName: (slug: string) => slug,
  productDescription: (slug: string) => `desc:${slug}`,
  categoryName: (product: { category: string }) => product.category,
  allergenName: (allergen: string) =>
    ({ milk: "우유", egg: "달걀", wheat: "밀", nuts: "견과류" })[allergen] ?? "",
};

describe("isRecommendRequest", () => {
  it("입력을 검증합니다", () => {
    expect(isRecommendRequest({ query: "상큼한 것", chips: [], locale: "ko" })).toBe(true);
    expect(isRecommendRequest({ query: "", chips: ["coffee"], locale: "ko" })).toBe(true);
    expect(isRecommendRequest({ query: " ", chips: [], locale: "ko" })).toBe(false);
    expect(isRecommendRequest({ query: "가".repeat(201), chips: [], locale: "ko" })).toBe(false);
    expect(isRecommendRequest({ query: "a", chips: ["nope"], locale: "ko" })).toBe(false);
    expect(isRecommendRequest(null)).toBe(false);
  });
});

describe("sanitizeRecommendation", () => {
  it("없는 상품과 중복을 지우고 3개까지만 남깁니다", () => {
    const result = sanitizeRecommendation({
      intro: "안녕",
      picks: [
        { slug: "tiramisu", reason: "a" },
        { slug: "made-up", reason: "b" },
        { slug: "tiramisu", reason: "c" },
        { slug: "fraisier", reason: "d" },
        { slug: "baklava", reason: "e" },
        { slug: "egg-tart", reason: "f" },
      ],
    });
    expect(result.picks.map(({ slug }) => slug)).toEqual(["tiramisu", "fraisier", "baklava"]);
  });

  it("모델이 고른 상품이어도 제외한 알레르기 성분이 있으면 뺍니다", () => {
    const fromModel = sanitizeRecommendation({
      excludedAllergens: ["nuts"],
      picks: [
        { slug: "baklava", reason: "a" },
        { slug: "tiramisu", reason: "b" },
      ],
    });
    expect(fromModel.picks.map(({ slug }) => slug)).toEqual(["tiramisu"]);
    const fromChip = sanitizeRecommendation({ picks: [{ slug: "baklava", reason: "a" }] }, [
      "nuts",
    ]);
    expect(fromChip.picks).toEqual([]);
  });

  it("형식이 잘못돼도 깨지지 않습니다", () => {
    expect(sanitizeRecommendation(null)).toEqual({ intro: "", picks: [] });
    expect(sanitizeRecommendation({ intro: 1, picks: "x", excludedAllergens: "y" })).toEqual({
      intro: "",
      picks: [],
    });
  });
});

describe("recommendLocally", () => {
  it("맛 선택에 맞는 상품을 먼저 고릅니다", () => {
    const picks = recommendLocally({ query: "", chips: ["coffee"] }, words as never);
    expect(picks[0]?.slug).toBe("tiramisu");
    expect(picks).toHaveLength(3);
    expect(picks[0]?.reason).toBe("desc:tiramisu");
  });

  it("견과류 제외를 지킵니다", () => {
    expect(requiredExclusions(["nutFree"])).toEqual(["nuts"]);
    const picks = recommendLocally({ query: "", chips: ["nutty", "nutFree"] }, words as never);
    expect(picks.length).toBeGreaterThan(0);
    for (const { slug } of picks) expect(getProduct(slug)?.allergens).not.toContain("nuts");
  });

  it("입력에 알레르기 단어가 있으면 안전하게 뺍니다", () => {
    const picks = recommendLocally({ query: "견과류 없는 걸로", chips: [] }, words as never);
    for (const { slug } of picks) expect(getProduct(slug)?.allergens).not.toContain("nuts");
  });

  it("입력에 카테고리가 있으면 우선합니다", () => {
    const picks = recommendLocally({ query: "pancake 먹고 싶어요", chips: [] }, words as never);
    expect(getProduct(picks[0]?.slug ?? "")?.category).toBe("pancake");
  });
});
