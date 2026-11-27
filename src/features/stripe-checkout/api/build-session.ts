import type Stripe from "stripe";

import { isValidOrderLines, summarizeCart, type CartLine } from "@/entities/cart";
import {
  currencyForLocale,
  getProduct,
  priceInCurrency,
  salePriceUsd,
  shippingInCurrency,
} from "@/entities/product";
import { demoPricing } from "@/entities/product/index.server";
import { DEMO_MODE, SITE_NAME } from "@/shared/config";
import { LOCALES } from "@/shared/i18n/index.server";

import { toMinorUnits } from "./minor-units";
import { ORDER_APP, packSlugs } from "./order-metadata";

export type OrderSource = "cart" | "buy";

export type SessionRequest = {
  items: CartLine[];
  locale: string;
  expectedTotal: number;
  source: OrderSource;
  /** 공개 데모에서만: 어드민이 고친 가격·할인·숨김. */
  pricing?: unknown;
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
  /** 공개 데모인지(기본은 빌드 값). 데모가 아니면 요청의 가격 수정값을 무시합니다. */
  demo?: boolean;
};

/** 금액은 브라우저 값을 쓰지 않고 카탈로그로 계산합니다. 금액이 다르면 null을 돌려줍니다. */
export function buildSessionParams({
  request,
  origin,
  productName,
  shippingName,
  demo = DEMO_MODE,
}: BuildInput): Stripe.Checkout.SessionCreateParams | null {
  const { items, locale, expectedTotal, source } = request;
  const pricing = demoPricing(request.pricing, demo);
  if (summarizeCart(items, locale, pricing).total !== expectedTotal) return null;
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
    if (!product || pricing[item.slug]?.hidden) return [];
    const price = priceInCurrency(salePriceUsd(product, pricing[item.slug]), currency);
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
