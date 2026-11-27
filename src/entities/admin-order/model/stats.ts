import { getProduct, type Category } from "@/entities/product/@x/admin-order";

import { refundedAmount, type AdminOrder } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/** 매출에 넣는 주문: 취소를 뺀 주문. 환불액은 따로 뺍니다. */
const counted = (order: AdminOrder) => order.status !== "cancelled";

/** 달러 환산 환불액(주문 통화 환불액을 같은 비율로 환산). */
const refundedUsd = (order: AdminOrder) =>
  order.total > 0 ? (refundedAmount(order) / order.total) * order.totalUsd : 0;

export type DashboardStats = {
  revenueUsd: number;
  orders: number;
  averageUsd: number;
  refundsUsd: number;
  /** 지난 days일의 날짜별 순매출(오래된 날 → 오늘) */
  daily: { day: number; revenueUsd: number; orders: number }[];
  top: { slug: string; quantity: number; revenueUsd: number }[];
  categories: { category: Category; quantity: number }[];
  pending: number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function dashboardStats(
  orders: readonly AdminOrder[],
  now: number,
  days = 14,
): DashboardStats {
  const start = startOfDay(now) - (days - 1) * DAY;
  const recent = orders.filter((order) => order.createdAt >= start && counted(order));
  const revenueUsd = recent.reduce((sum, order) => sum + order.totalUsd - refundedUsd(order), 0);
  const refundsUsd = orders
    .filter((order) => order.createdAt >= start)
    .reduce((sum, order) => sum + refundedUsd(order), 0);
  const daily = Array.from({ length: days }, (_, index) => ({
    day: start + index * DAY,
    revenueUsd: 0,
    orders: 0,
  }));
  for (const order of recent) {
    const slot = daily[Math.floor((order.createdAt - start) / DAY)];
    if (!slot) continue;
    slot.revenueUsd = round(slot.revenueUsd + order.totalUsd - refundedUsd(order));
    slot.orders += 1;
  }
  const bySlug = new Map<string, { quantity: number; revenueUsd: number }>();
  const byCategory = new Map<Category, number>();
  for (const order of recent) {
    if (order.status === "refunded") continue;
    for (const line of order.items) {
      const product = getProduct(line.slug);
      if (!product) continue;
      const entry = bySlug.get(line.slug) ?? { quantity: 0, revenueUsd: 0 };
      entry.quantity += line.quantity;
      entry.revenueUsd = round(entry.revenueUsd + product.priceUsd * line.quantity);
      bySlug.set(line.slug, entry);
      byCategory.set(product.category, (byCategory.get(product.category) ?? 0) + line.quantity);
    }
  }
  return {
    revenueUsd: round(revenueUsd),
    orders: recent.length,
    averageUsd: recent.length > 0 ? round(revenueUsd / recent.length) : 0,
    refundsUsd: round(refundsUsd),
    daily,
    top: [...bySlug.entries()]
      .map(([slug, entry]) => ({ slug, ...entry }))
      .sort((a, b) => b.quantity - a.quantity || b.revenueUsd - a.revenueUsd)
      .slice(0, 5),
    categories: [...byCategory.entries()]
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => b.quantity - a.quantity),
    pending: orders.filter((order) => order.status === "paid" || order.status === "preparing")
      .length,
  };
}

/** 그 시각이 속한 날의 0시(브라우저 시간대). */
export function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
