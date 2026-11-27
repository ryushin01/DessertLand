import type { CartLine } from "./lines";
import {
  currencyForLocale,
  getProduct,
  priceInCurrency,
  salePriceUsd,
  shippingInCurrency,
  type CatalogOverrides,
  type Product,
} from "@/entities/product/@x/cart";

export type SummaryLine = { product: Product; quantity: number; lineTotal: number };
export type CartSummary = {
  lines: SummaryLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

/**
 * 카탈로그에서 사라진 상품은 건너뜁니다. 저장된 장바구니가 오래되었을 수 있습니다.
 * overrides: 공개 데모에서 어드민이 고친 가격·할인·숨김(없으면 카탈로그 가격). 숨긴 상품은 주문에서 뺍니다.
 */
export function summarizeCart(
  cart: CartLine[],
  locale: string,
  overrides: CatalogOverrides = {},
): CartSummary {
  const currency = currencyForLocale(locale);
  const lines = cart.flatMap<SummaryLine>((line) => {
    const product = getProduct(line.slug);
    if (!product || overrides[line.slug]?.hidden) return [];
    return [
      {
        product,
        quantity: line.quantity,
        lineTotal:
          priceInCurrency(salePriceUsd(product, overrides[line.slug]), currency) * line.quantity,
      },
    ];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = lines.length > 0 ? shippingInCurrency(currency) : 0;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
