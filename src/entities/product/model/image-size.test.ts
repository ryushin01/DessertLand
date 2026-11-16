import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRODUCTS } from "./catalog";

/** next.config.ts의 가장 큰 deviceSizes와 같아야 합니다. 더 큰 사진은 그 너비로 줄여 둡니다. */
const MAX_WIDTH = 1500;

/** WebP 파일 머리글에서 가로·세로 크기를 읽습니다(VP8, VP8L, VP8X). */
function webpSize(file: string): { width: number; height: number } {
  const data = readFileSync(file);
  const chunk = data.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return { width: 1 + data.readUIntLE(24, 3), height: 1 + data.readUIntLE(27, 3) };
  }
  if (chunk === "VP8L") {
    const bits = data.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8 ") {
    return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
  }
  throw new Error(`WebP가 아닙니다: ${file}`);
}

describe("상품 사진 크기", () => {
  it.each(PRODUCTS.map((product) => [product.slug, product] as const))(
    "%s: 파일 크기가 데이터와 같고 가로가 상한 이하입니다",
    (_slug, product) => {
      const size = webpSize(join(process.cwd(), "public", product.image.src));
      expect(size).toEqual({ width: product.image.width, height: product.image.height });
      expect(size.width).toBeLessThanOrEqual(MAX_WIDTH);
    },
  );
});
