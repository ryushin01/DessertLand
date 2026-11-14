import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import ko from "@/shared/i18n/messages/ko.json";

import { PRODUCTS } from "./catalog";

/** 사진 출처는 화면이 아니라 docs/credits.md에 둡니다. "## 출처 이름" 부분마다 표를 머리글 이름으로 읽습니다. */
const credits = readFileSync(join(process.cwd(), "docs", "credits.md"), "utf8");
type Table = { section: string; columns: string[]; rows: string[][] };
const splitCells = (line: string) =>
  line.split(" | ").map((cell) => cell.replace(/^\| /, "").replace(/ \|$/, ""));
const tables: Table[] = credits.split(/^## /m).flatMap((block) => {
  const lines = block.split("\n");
  const header = lines.find((line) => line.startsWith("| 사진 |"));
  if (!header) return [];
  return [
    {
      section: lines[0]!.trim(),
      columns: splitCells(header),
      rows: lines.filter((line) => line.startsWith("| ") && line !== header).map(splitCells),
    },
  ];
});

/** 출처만 밝히면 상업적으로 쓰고 고칠 수 있는 라이선스(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)만 씁니다. */
const FREE_LICENSE = /^\[(CC0|Public domain|CC BY(-SA)? [0-9.]+[^\]]*)\]\(https?:\/\//;
/**
 * 부분마다 칸과 원본 주소 형식입니다. CC 2.0·3.0은 사진가가 붙인 제목도 밝히게 합니다.
 * Commons는 원본 주소의 파일 이름이 제목이고, Flickr는 주소에 제목이 없어 제목 칸을 따로 둡니다.
 */
const SOURCES: Record<string, { columns: string[]; source: RegExp }> = {
  "Wikimedia Commons": {
    columns: ["사진", "저작자", "사용 허락", "원본"],
    source: /^\[Wikimedia Commons\]\(https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
  },
  Flickr: {
    columns: ["사진", "제목", "저작자", "사용 허락", "원본"],
    source: /^\[Flickr\]\(https:\/\/www\.flickr\.com\/photos\/[^/]+\/\d+\)$/,
  },
};

const nameOf = (slug: string) => (ko.products as Record<string, { name: string }>)[slug]?.name;

describe("상품 사진과 출처", () => {
  it("모든 상품에 사진 파일이 있고, docs/credits.md에 출처가 한 줄씩 있습니다", () => {
    const labels = tables.flatMap(({ rows }) => rows.map(([label]) => label));
    for (const product of PRODUCTS) {
      expect(existsSync(join(process.cwd(), "public", product.image.src)), product.slug).toBe(true);
      const name = nameOf(product.slug);
      expect(name, product.slug).toBeTruthy();
      expect(
        labels.filter((label) => label === name),
        product.slug,
      ).toHaveLength(1);
    }
  });

  it("출처 표의 줄마다 머리글과 칸 수가 같습니다", () => {
    expect(tables.length).toBeGreaterThan(0);
    for (const { section, columns, rows } of tables) {
      for (const row of rows) expect(row, `${section}: ${row[0]}`).toHaveLength(columns.length);
    }
  });

  it.each(Object.keys(SOURCES))(
    "%s 사진은 쓸 수 있는 라이선스와 원본 주소를 밝힙니다",
    (section) => {
      const table = tables.find((candidate) => candidate.section === section);
      const { columns, source } = SOURCES[section]!;
      expect(table?.columns).toEqual(columns);
      expect(table!.rows.length).toBeGreaterThan(0);
      const cell = (row: string[], column: string) => row[columns.indexOf(column)];
      for (const row of table!.rows) {
        for (const column of columns) expect(cell(row, column), `${row[0]} ${column}`).toBeTruthy();
        expect(cell(row, "사용 허락"), row[0]).toMatch(FREE_LICENSE);
        expect(cell(row, "원본"), row[0]).toMatch(source);
      }
    },
  );

  it("상품 slug와 한국어 이름이 겹치지 않습니다", () => {
    const slugs = PRODUCTS.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = slugs.map(nameOf);
    expect(new Set(names).size).toBe(names.length);
  });
});
