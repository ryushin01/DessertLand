import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import ko from "@/shared/i18n/messages/ko.json";

import { PRODUCTS } from "./catalog";

/** 사진 출처는 화면이 아니라 docs/credits.md에 둡니다. 표의 첫 칸(사진 이름)과 사용 허락 칸을 읽습니다. */
const credits = readFileSync(join(process.cwd(), "docs", "credits.md"), "utf8");
const rows = credits
  .split("\n")
  .filter((line) => line.startsWith("| ") && !line.startsWith("| 사진 |"))
  .map((line) => line.split(" | ").map((cell) => cell.replace(/^\| /, "").replace(/ \|$/, "")));
const commons = credits.slice(credits.indexOf("## Wikimedia Commons"));

const nameOf = (slug: string) => (ko.products as Record<string, { name: string }>)[slug]?.name;

describe("상품 사진과 출처", () => {
  it("모든 상품에 사진 파일이 있고, docs/credits.md에 출처가 한 줄씩 있습니다", () => {
    for (const product of PRODUCTS) {
      expect(existsSync(join(process.cwd(), "public", product.image.src)), product.slug).toBe(true);
      const name = nameOf(product.slug);
      expect(name, product.slug).toBeTruthy();
      expect(rows.filter(([label]) => label === name), product.slug).toHaveLength(1);
    }
  });

  it("Wikimedia Commons 사진은 쓸 수 있는 라이선스와 원본 주소를 밝힙니다", () => {
    const commonsRows = rows.filter((row) => commons.includes(row.join(" | ")));
    expect(commonsRows.length).toBeGreaterThan(0);
    for (const [label, author, license, source] of commonsRows) {
      expect(author, label).toBeTruthy();
      expect(license, label).toMatch(/^\[(CC0|Public domain|CC BY(-SA)? [0-9.]+[^\]]*)\]\(https?:\/\//);
      expect(source, label).toMatch(/^\[Wikimedia Commons\]\(https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });

  it("상품 slug와 한국어 이름이 겹치지 않습니다", () => {
    const slugs = PRODUCTS.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = slugs.map(nameOf);
    expect(new Set(names).size).toBe(names.length);
  });
});
