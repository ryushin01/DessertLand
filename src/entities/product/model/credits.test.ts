import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { PRODUCTS } from "./catalog";

// 서버 전용 표시는 테스트(Node)에서 의미가 없으므로 비웁니다.
vi.mock("server-only", () => ({}));

const { PHOTO_CREDITS } = await import("./credits");

describe("상품 사진과 출처", () => {
  it("모든 상품에 사진 파일과 출처가 있습니다", () => {
    for (const product of PRODUCTS) {
      expect(existsSync(join(process.cwd(), "public", product.image.src)), product.slug).toBe(true);
      const credit = PHOTO_CREDITS[product.slug];
      expect(credit?.name, product.slug).toBeTruthy();
      expect(credit?.photoUrl, product.slug).toMatch(/^https:\/\/(unsplash\.com|commons\.wikimedia\.org)\//);
    }
  });

  it("Wikimedia Commons 사진은 쓸 수 있는 라이선스와 주소를 밝힙니다", () => {
    for (const [slug, credit] of Object.entries(PHOTO_CREDITS)) {
      if (!credit.photoUrl.includes("wikimedia")) continue;
      expect(credit.license?.name, slug).toMatch(/^(CC0|Public domain|CC BY(-SA)? [0-9.]+)/);
      expect(credit.license?.url, slug).toMatch(/^https?:\/\//);
    }
  });

  it("상품 slug가 겹치지 않습니다", () => {
    const slugs = PRODUCTS.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
