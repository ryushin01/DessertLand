import type Stripe from "stripe";

import { isValidOrderLines, summarizeCart, type CartLine } from "@/entities/cart";
import {
  currencyForLocale,
  getProduct,
  priceInCurrency,
  shippingInCurrency,
} from "@/entities/product";
import { SITE_NAME } from "@/shared/config";
import { LOCALES } from "@/shared/i18n/index.server";

import { toMinorUnits } from "./minor-units";
import { ORDER_APP, packSlugs } from "./order-metadata";

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
    isValidOrderLines(request?.items) &&
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
    // 안내한 테스트 카드로만 결제하고, 사이트에 표시한 통화와 금액을 그대로 청구합니다.
    allowed_payment_method_types: ["card"],
    adaptive_pricing: { enabled: false },
    // 샌드박스를 다른 프로젝트와 함께 쓰므로, 결제 화면 이름은 계정 설정이 아니라 여기서 정합니다.
    branding_settings: { display_name: SITE_NAME },
    locale: STRIPE_LOCALES[locale as keyof typeof STRIPE_LOCALES],
    line_items: [...lines, lineItem(shippingName, shippingInCurrency(currency), 1)],
    shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
    // 결제 뒤 장바구니에서 산 상품만 빼도록 slug를 남깁니다. 값 하나가 500자를 넘지 않게 나눠 담습니다.
    // app: 샌드박스를 함께 쓰는 다른 프로젝트의 세션과 구분합니다.
    metadata: { app: ORDER_APP, source, ...packSlugs(items.map((item) => item.slug)) },
    success_url: `${origin}/${locale}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/checkout?${canceledQuery}`,
  };
}
