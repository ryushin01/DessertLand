import { describe, expect, it } from "vitest";

import { shopCategoryRedirect } from "./shop-category";

const redirect = (path: string) => {
  const url = shopCategoryRedirect(new URL(path, "https://site.test"));
  return url ? url.pathname + url.search : null;
};

describe("shopCategoryRedirect", () => {
  it("예전 분류 주소를 분류별 페이지로 넘기고 다른 매개변수는 둡니다", () => {
    expect(redirect("/ko/shop?category=cake")).toBe("/ko/shop/category/cake");
    expect(redirect("/en/shop/?category=drink&utm=x")).toBe("/en/shop/category/drink?utm=x");
  });

  it("0.5.0 이전 분류는 새 분류로, 맞는 분류가 없으면 전체 목록으로 넘깁니다", () => {
    expect(redirect("/ko/shop?category=muffin")).toBe("/ko/shop/category/baked");
    expect(redirect("/ja/shop?category=classic")).toBe("/ja/shop");
  });

  it.each([
    "/ko/shop",
    "/ko/shop?category=nope",
    "/ko/shop?category=toString",
    "/xx/shop?category=cake",
    "/ko/shop/baklava?category=cake",
    "/ko/shop/category/cake",
    "/ko/checkout?category=cake",
  ])("그 밖의 주소는 넘기지 않습니다: %s", (path) => {
    expect(redirect(path)).toBeNull();
  });
});
