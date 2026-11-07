import { describe, expect, it } from "vitest";

import { MAX_QUANTITY, addLine, countItems, removeLine, setLineQuantity } from "./lines";

describe("cart lines", () => {
  it("새 상품을 추가하고 같은 상품은 수량을 더합니다", () => {
    const once = addLine([], "baklava");
    expect(once).toEqual([{ slug: "baklava", quantity: 1 }]);
    expect(addLine(once, "baklava", 2)).toEqual([{ slug: "baklava", quantity: 3 }]);
  });

  it("최대 수량을 넘지 않습니다", () => {
    expect(addLine([{ slug: "a", quantity: MAX_QUANTITY }], "a")[0]?.quantity).toBe(MAX_QUANTITY);
  });

  it("수량이 0이면 삭제합니다", () => {
    expect(setLineQuantity([{ slug: "a", quantity: 2 }], "a", 0)).toEqual([]);
  });

  it("삭제와 합계를 계산합니다", () => {
    const lines = [
      { slug: "a", quantity: 2 },
      { slug: "b", quantity: 3 },
    ];
    expect(removeLine(lines, "a")).toEqual([{ slug: "b", quantity: 3 }]);
    expect(countItems(lines)).toBe(5);
  });
});
