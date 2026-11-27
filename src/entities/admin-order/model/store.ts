"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

import { SAVED_ORDERS_KEY, isSavedOrder } from "@/entities/order/@x/admin-order";
import { DEMO_MODE } from "@/shared/config";

import { createSeedOrders, fromSavedOrder } from "./build";
import { adminOrderSchema, type AdminOrder } from "./types";

/** 어드민 주문 저장소(이 브라우저). 시드 주문과, 처리 단계를 바꾼 주문이 들어 있습니다. */
export const ADMIN_ORDERS_KEY = "dessert-land.admin.orders";

const stateSchema = z.object({ seededAt: z.number(), orders: z.array(z.unknown()) });

/** now: 저장소를 읽은 시각(대시보드 기간 계산의 기준). 렌더링 중에 시계를 읽지 않으려고 함께 둡니다. */
type Snapshot = { orders: AdminOrder[]; ready: boolean; now: number };
const EMPTY: Snapshot = { orders: [], ready: false, now: 0 };
const listeners = new Set<() => void>();
let cache: { key: string; value: Snapshot } | null = null;

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 저장된 어드민 주문. 모양이 다른 주문은 하나씩 버립니다. 저장값이 없으면 null. */
function parseStored(raw: string | null): AdminOrder[] | null {
  if (!raw) return null;
  try {
    const state = stateSchema.safeParse(JSON.parse(raw));
    if (!state.success) return null;
    return state.data.orders.flatMap((order) => {
      const parsed = adminOrderSchema.safeParse(order);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return null;
  }
}

function parseShopOrders(raw: string | null): AdminOrder[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isSavedOrder).flatMap((order) => fromSavedOrder(order) ?? []);
  } catch {
    return [];
  }
}

/** 저장된 주문에 없는 주문만 더합니다(이미 처리한 주문의 단계·환불 기록을 지키려고). 최신 주문이 앞입니다. */
export function mergeOrders(
  stored: readonly AdminOrder[],
  incoming: readonly AdminOrder[],
): AdminOrder[] {
  const ids = new Set(stored.map((order) => order.id));
  return [...stored, ...incoming.filter((order) => !ids.has(order.id))].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

function write(orders: readonly AdminOrder[]) {
  localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify({ seededAt: Date.now(), orders }));
  listeners.forEach((listener) => listener());
}

function read(): Snapshot {
  const stored = readRaw(ADMIN_ORDERS_KEY);
  const shop = readRaw(SAVED_ORDERS_KEY);
  const key = `${stored}\u0000${shop}`;
  if (cache?.key === key) return cache.value;
  let orders = parseStored(stored);
  if (!orders) {
    // 공개 데모는 처음 열 때 시드 주문을 만들어 저장합니다(이후로는 같은 주문이 남음).
    // 실제 운영(데모 꺼짐)은 시드 없이 Stripe에서 읽은 주문(importOrders)만 씁니다.
    orders = DEMO_MODE ? createSeedOrders(Date.now()) : [];
    try {
      localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify({ seededAt: Date.now(), orders }));
    } catch {
      // 저장하지 못해도 이번 화면에는 시드 주문을 보여 줍니다.
    }
  }
  const value = {
    orders: mergeOrders(orders, parseShopOrders(shop)),
    ready: true,
    now: Date.now(),
  };
  cache = { key: `${readRaw(ADMIN_ORDERS_KEY)}\u0000${shop}`, value };
  return value;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** 어드민 주문 목록. 서버 렌더링 중에는 ready가 false입니다(저장소는 브라우저에만 있음). */
export const useAdminOrders = (): Snapshot => useSyncExternalStore(subscribe, read, () => EMPTY);

/** 주문 하나를 바꿔 저장합니다. */
export function saveOrder(order: AdminOrder) {
  const { orders } = read();
  write(orders.map((item) => (item.id === order.id ? order : item)));
}

/** 서버(Stripe)에서 읽은 주문을 더합니다. 이미 있는 주문은 이 브라우저의 처리 기록을 지킵니다. */
export function importOrders(incoming: readonly AdminOrder[]) {
  const { orders } = read();
  const merged = mergeOrders(orders, incoming);
  if (merged.length !== orders.length) write(merged);
}

/** 데모 데이터 초기화: 저장한 어드민 주문을 지우고 시드를 다시 만듭니다(쇼핑몰 주문 내역은 그대로). */
export function resetOrders() {
  localStorage.removeItem(ADMIN_ORDERS_KEY);
  cache = null;
  listeners.forEach((listener) => listener());
}
