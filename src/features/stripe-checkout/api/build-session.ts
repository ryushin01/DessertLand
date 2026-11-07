import type Stripe from "stripe";

import { MAX_QUANTITY, type CartLine } from "@/entities/cart";
import {
  currencyForLocale,
  getProduct,
  priceInCurrency,
  shippingInCurrency,
} from "@/entities/product";
import { summarizeCart } from "@/features/cart-summary";
import { LOCALES } from "@/shared/i18n/routing";

import { toMinorUnits } from "./minor-units";

export type OrderSource = "cart" | "buy";

export type SessionRequest = {
  items: CartLine[];
  locale: string;
  expectedTotal: number;
  source: OrderSource;
};

const STRIPE_LOCALES = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh",
  fr: "fr",
  it: "it",
  es: "es",
  de: "de",
  pt: "pt",
  tr: "tr",
} as const satisfies Record<(typeof LOCALES)[number], Stripe.Checkout.SessionCreateParams.Locale>;

const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["KR", "US", "JP", "CN", "FR", "IT", "ES", "DE", "PT", "TR", "GB", "CA", "AU", "SE"];

export function isSessionRequest(body: unknown): body is SessionRequest {
  const request = body as Partial<SessionRequest> | null;
  return (
    Array.isArray(request?.items) &&
    request.items.length > 0 &&
    request.items.every(
      (item: Partial<CartLine> | null) =>
        typeof item?.slug === "string" &&
        getProduct(item.slug) !== undefined &&
        Number.isInteger(item.quantity) &&
        (item.quantity as number) >= 1 &&
        (item.quantity as number) <= MAX_QUANTITY,
    ) &&
    new Set(request.items.map((item) => item.slug)).size === request.items.length &&
    LOCALES.includes(request.locale as never) &&
    typeof request.expectedTotal === "number" &&
    (request.source === "cart" || request.source === "buy")
  );
}

type BuildInput = {
  request: SessionRequest;
  origin: string;
  productName: (slug: string) => string;
  shippingName: string;
};

/** 금액은 브라우저 값을 쓰지 않고 카탈로그로 계산합니다. 금액이 다르면 null을 돌려줍니다. */
export function buildSessionParams({
  request,
  origin,
  productName,
  shippingName,
}: BuildInput): Stripe.Checkout.SessionCreateParams | null {
  const { items, locale, expectedTotal, source } = request;
  if (summarizeCart(items, locale).total !== expectedTotal) return null;
  const currency = currencyForLocale(locale);
  const lineItem = (name: string, amount: number, quantity: number) => ({
    quantity,
    price_data: {
      currency: currency.toLowerCase(),
      unit_amount: toMinorUnits(amount, currency),
      product_data: { name },
    },
  });
  const lines = items.flatMap((item) => {
    const product = getProduct(item.slug);
    if (!product) return [];
    const price = priceInCurrency(product.priceUsd, currency);
    return [lineItem(productName(item.slug), price, item.quantity)];
  });
  const first = items[0];
  const canceledQuery =
    source === "buy" && first ? `buy=${first.slug}&qty=${first.quantity}&canceled=1` : "canceled=1";
  return {
    mode: "payment",
    locale: STRIPE_LOCALES[locale as keyof typeof STRIPE_LOCALES],
    line_items: [...lines, lineItem(shippingName, shippingInCurrency(currency), 1)],
    shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
    metadata: { source },
    success_url: `${origin}/${locale}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/checkout?${canceledQuery}`,
  };
}
