import { describe, expect, it } from "vitest";

import {
  MAX_QUANTITY,
  addLine,
  countItems,
  deductPurchased,
  removeLine,
  removePurchased,
  selectLines,
  setLineQuantity,
} from "./lines";

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

  it("뺀 상품을 제외한 줄만 주문에 넣습니다", () => {
    const lines = [
      { slug: "a", quantity: 1 },
      { slug: "b", quantity: 2 },
    ];
    expect(selectLines(lines, ["a"])).toEqual([{ slug: "b", quantity: 2 }]);
    expect(selectLines(lines, [])).toEqual(lines);
  });

  it("결제한 상품만 장바구니에서 빼고 나머지는 남깁니다", () => {
    const lines = [
      { slug: "a", quantity: 1 },
      { slug: "b", quantity: 2 },
    ];
    expect(removePurchased(lines, ["b"])).toEqual([{ slug: "a", quantity: 1 }]);
  });

  it("결제한 수량만큼만 빼, 결제 뒤 더 담은 수량과 다른 상품은 남깁니다", () => {
    const lines = [
      { slug: "a", quantity: 3 },
      { slug: "b", quantity: 1 },
    ];
    expect(deductPurchased(lines, [{ slug: "a", quantity: 2 }])).toEqual([
      { slug: "a", quantity: 1 },
      { slug: "b", quantity: 1 },
    ]);
  });

  it("산 수량이 장바구니 수량보다 많거나 같으면 그 줄을 지웁니다", () => {
    const lines = [
      { slug: "a", quantity: 2 },
      { slug: "b", quantity: 2 },
      { slug: "c", quantity: 1 },
    ];
    expect(
      deductPurchased(lines, [
        { slug: "a", quantity: 2 },
        { slug: "b", quantity: 5 },
      ]),
    ).toEqual([{ slug: "c", quantity: 1 }]);
  });

  it("여러 주문에서 같은 상품을 샀으면 산 수량을 모두 더해 뺍니다", () => {
    expect(
      deductPurchased(
        [{ slug: "a", quantity: 5 }],
        [
          { slug: "a", quantity: 1 },
          { slug: "a", quantity: 2 },
        ],
      ),
    ).toEqual([{ slug: "a", quantity: 2 }]);
  });
});
