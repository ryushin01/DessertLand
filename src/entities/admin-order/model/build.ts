import {
  PRODUCTS,
  currencyForLocale,
  getProduct,
  priceInCurrency,
  shippingInCurrency,
} from "@/entities/product/@x/admin-order";
import type { SavedOrder } from "@/entities/order/@x/admin-order";

import type { AdminOrder, OrderLine, OrderStatus } from "./types";

const LOCALES = ["ko", "en", "ja", "zh", "fr", "it", "es", "de", "pt", "tr"] as const;
const DAY = 24 * 60 * 60 * 1000;
const SHIPPING_USD = 8;

/** 같은 씨앗이면 늘 같은 수열(mulberry32). 시드 주문이 새로고침마다 바뀌지 않게 합니다. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** 주문 줄의 금액을 그 언어 통화로 계산합니다(쇼핑몰 결제와 같은 규칙). */
export function priceLines(lines: readonly { slug: string; quantity: number }[], locale: string) {
  const currency = currencyForLocale(locale);
  const items: OrderLine[] = lines.flatMap((line) => {
    const product = getProduct(line.slug);
    return product
      ? [
          {
            slug: line.slug,
            quantity: line.quantity,
            unitPrice: priceInCurrency(product.priceUsd, currency),
          },
        ]
      : [];
  });
  const subtotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shipping = items.length > 0 ? shippingInCurrency(currency) : 0;
  const totalUsd =
    lines.reduce((sum, line) => sum + (getProduct(line.slug)?.priceUsd ?? 0) * line.quantity, 0) +
    (items.length > 0 ? SHIPPING_USD : 0);
  return {
    currency,
    items,
    shipping,
    total: subtotal + shipping,
    totalUsd: Math.round(totalUsd * 100) / 100,
  };
}

/** 오래된 주문일수록 다음 단계로 많이 나아가 있습니다. */
function statusForAge(ageDays: number, roll: number): OrderStatus {
  if (roll < 0.05) return "cancelled";
  if (ageDays > 6) return roll < 0.1 ? "refunded" : "delivered";
  if (ageDays > 3) return "shipped";
  if (ageDays > 1) return "preparing";
  return "paid";
}

const FLOW: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

function historyFor(status: OrderStatus, createdAt: number) {
  if (status === "cancelled" || status === "refunded") {
    return [
      { status: "paid" as const, at: createdAt },
      { status, at: createdAt + DAY / 2 },
    ];
  }
  return FLOW.slice(0, FLOW.indexOf(status) + 1).map((item, index) => ({
    status: item,
    at: createdAt + index * DAY,
  }));
}

/**
 * 공개 데모의 시드 주문. 지금 시각을 기준으로 지난 30일에 걸쳐 만들어 대시보드가 늘 최근 기록을 보여 줍니다.
 * 고객은 개인정보 없이 "고객 #번호"로만 나타냅니다.
 */
export function createSeedOrders(now: number, count = 72): AdminOrder[] {
  const random = seededRandom(20261127);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
  // 인기 상품이 눈에 띄도록 앞쪽 상품을 더 자주 고릅니다.
  const popular = PRODUCTS.slice(0, 40);
  const orders: AdminOrder[] = [];
  for (let index = 0; index < count; index += 1) {
    const ageDays = Math.floor(Math.pow(random(), 1.3) * 30);
    const createdAt = now - ageDays * DAY - Math.floor(random() * DAY * 0.9);
    const locale = random() < 0.45 ? "ko" : pick(LOCALES);
    const lineCount = 1 + Math.floor(random() * 3);
    const slugs = new Set<string>();
    while (slugs.size < lineCount) slugs.add(pick(random() < 0.7 ? popular : PRODUCTS).slug);
    const priced = priceLines(
      [...slugs].map((slug) => ({ slug, quantity: 1 + Math.floor(random() * 3) })),
      locale,
    );
    const status = statusForAge(ageDays, random());
    const orderNo = `DL-${(0x5a0000 + index * 7919).toString(16).toUpperCase().slice(-6)}`;
    orders.push({
      id: orderNo,
      orderNo,
      createdAt,
      locale,
      ...priced,
      channel: random() < 0.6 ? "stripe" : "test",
      origin: "seed",
      customer: `고객 #${1000 + Math.floor(random() * 9000)}`,
      status,
      history: historyFor(status, createdAt),
      refunds:
        status === "refunded"
          ? [
              {
                id: `rf_seed_${index}`,
                amount: priced.total,
                at: createdAt + DAY / 2,
                reason: "고객 요청",
                method: "test",
              },
            ]
          : [],
    });
  }
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * 이 브라우저의 쇼핑몰에서 한 주문을 어드민 주문으로 바꿉니다.
 * Stripe 주문은 금액을 브라우저에 남기지 않으므로, 담은 상품으로 다시 계산한 금액을 보여 줍니다.
 */
export function fromSavedOrder(order: SavedOrder): AdminOrder | null {
  const lines = order.items ?? [];
  if (lines.length === 0) return null;
  const locale = order.kind === "demo" ? order.locale : "ko";
  const priced = priceLines(lines, locale);
  if (priced.items.length === 0) return null;
  const id = order.kind === "demo" ? order.orderNo : order.sessionId;
  return {
    id,
    orderNo: order.kind === "demo" ? order.orderNo : `Stripe ${order.sessionId.slice(0, 14)}…`,
    createdAt: order.createdAt,
    locale,
    ...priced,
    // 내장 테스트 결제는 서버가 계산한 실제 결제 금액이 남아 있습니다.
    total: order.kind === "demo" ? order.total : priced.total,
    channel: order.kind === "demo" ? "test" : "stripe",
    origin: "browser",
    customer: "이 브라우저",
    status: "paid",
    history: [{ status: "paid", at: order.createdAt }],
    refunds: [],
  };
}
