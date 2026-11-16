import { getProduct } from "@/entities/product/@x/cart";

import { MAX_QUANTITY, type CartLine } from "./lines";

/**
 * 한 주문에 넣을 수 있는 상품 종류 수입니다.
 * Stripe Checkout은 결제 항목을 100줄까지 받고, 그중 한 줄은 배송비입니다.
 */
export const MAX_ORDER_LINES = 99;

function isValidLine(item: unknown): item is CartLine {
  const line = item as Partial<CartLine> | null;
  return (
    typeof line?.slug === "string" &&
    getProduct(line.slug) !== undefined &&
    Number.isInteger(line.quantity) &&
    (line.quantity as number) >= 1 &&
    (line.quantity as number) <= MAX_QUANTITY
  );
}

/** 서버가 받은 주문 줄을 검사합니다: 있는 상품, 1~최대 수량, 같은 상품 한 줄, 종류 수 상한. */
export function isValidOrderLines(items: unknown): items is CartLine[] {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.length <= MAX_ORDER_LINES &&
    items.every(isValidLine) &&
    new Set(items.map((item) => item.slug)).size === items.length
  );
}
