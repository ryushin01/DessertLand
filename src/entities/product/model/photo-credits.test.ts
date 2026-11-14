import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import ko from "@/shared/i18n/messages/ko.json";

import { PRODUCTS } from "./catalog";

/** 사진 출처는 화면이 아니라 docs/credits.md에 둡니다. "## 출처 이름" 부분마다 표를 읽습니다. */
const credits = readFileSync(join(process.cwd(), "docs", "credits.md"), "utf8");
type Row = { section: string; cells: string[] };
const rows: Row[] = credits.split(/^## /m).flatMap((block) => {
  const section = block.split("\n", 1)[0]!.trim();
  return block
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.startsWith("| 사진 |"))
    .map((line) => ({
      section,
      cells: line.split(" | ").map((cell) => cell.replace(/^\| /, "").replace(/ \|$/, "")),
    }));
});

/** 출처만 밝히면 상업적으로 쓰고 고칠 수 있는 라이선스(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)만 씁니다. */
const FREE_LICENSE = /^\[(CC0|Public domain|CC BY(-SA)? [0-9.]+[^\]]*)\]\(https?:\/\//;
const SOURCES: Record<string, RegExp> = {
  "Wikimedia Commons": /^\[Wikimedia Commons\]\(https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
  Flickr: /^\[Flickr\]\(https:\/\/www\.flickr\.com\/photos\/[^/]+\/\d+\)$/,
};

const nameOf = (slug: string) => (ko.products as Record<string, { name: string }>)[slug]?.name;

describe("상품 사진과 출처", () => {
  it("모든 상품에 사진 파일이 있고, docs/credits.md에 출처가 한 줄씩 있습니다", () => {
    for (const product of PRODUCTS) {
      expect(existsSync(join(process.cwd(), "public", product.image.src)), product.slug).toBe(true);
      const name = nameOf(product.slug);
      expect(name, product.slug).toBeTruthy();
      expect(rows.filter(({ cells: [label] }) => label === name), product.slug).toHaveLength(1);
    }
  });

  it.each(Object.keys(SOURCES))("%s 사진은 쓸 수 있는 라이선스와 원본 주소를 밝힙니다", (section) => {
    const sectionRows = rows.filter((row) => row.section === section);
    expect(sectionRows.length).toBeGreaterThan(0);
    for (const { cells } of sectionRows) {
      const [label, author, license, source] = cells;
      expect(author, label).toBeTruthy();
      expect(license, label).toMatch(FREE_LICENSE);
      expect(source, label).toMatch(SOURCES[section]!);
    }
  });

  it("상품 slug와 한국어 이름이 겹치지 않습니다", () => {
    const slugs = PRODUCTS.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = slugs.map(nameOf);
    expect(new Set(names).size).toBe(names.length);
  });
});
