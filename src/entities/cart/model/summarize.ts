import type { CartLine } from "./lines";
import {
  currencyForLocale,
  getProduct,
  priceInCurrency,
  shippingInCurrency,
  type Product,
} from "@/entities/product/@x/cart";

export type SummaryLine = { product: Product; quantity: number; lineTotal: number };
export type CartSummary = {
  lines: SummaryLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

/** 카탈로그에서 사라진 상품은 건너뜁니다. 저장된 장바구니가 오래되었을 수 있습니다. */
export function summarizeCart(cart: CartLine[], locale: string): CartSummary {
  const currency = currencyForLocale(locale);
  const lines = cart.flatMap<SummaryLine>((line) => {
    const product = getProduct(line.slug);
    if (!product) return [];
    return [
      {
        product,
        quantity: line.quantity,
        lineTotal: priceInCurrency(product.priceUsd, currency) * line.quantity,
      },
    ];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = lines.length > 0 ? shippingInCurrency(currency) : 0;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
