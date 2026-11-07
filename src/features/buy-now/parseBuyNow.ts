import { MAX_QUANTITY, type CartLine } from "@/entities/cart";
import { getProduct } from "@/entities/product";

type Param = string | string[] | undefined;

/** 주소의 바로 구매 값을 검증합니다. 잘못된 값이면 장바구니 주문으로 처리합니다. */
export function parseBuyNow(buy: Param, qty: Param): CartLine | undefined {
  if (typeof buy !== "string" || !getProduct(buy)) return undefined;
  const parsed = typeof qty === "string" ? Number.parseInt(qty, 10) : 1;
  const quantity = Number.isNaN(parsed) ? 1 : Math.min(MAX_QUANTITY, Math.max(1, parsed));
  return { slug: buy, quantity };
}
