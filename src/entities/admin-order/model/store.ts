"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

import { SAVED_ORDERS_KEY, isSavedOrder } from "@/entities/order/@x/admin-order";

import { fromSavedOrder } from "./build";
import { adminOrderSchema, type AdminOrder } from "./types";

/** 어드민 주문 저장소(이 브라우저). 시드 주문과, 처리 단계를 바꾼 주문이 들어 있습니다. */
export const ADMIN_ORDERS_KEY = "dessert-land.admin.orders";

const stateSchema = z.object({ seededAt: z.number(), orders: z.array(z.unknown()) });

/** now: 저장소를 읽은 시각(대시보드 기간 계산의 기준). 렌더링 중에 시계를 읽지 않으려고 함께 둡니다. */
/**
 * synced: 서버(공개 데모는 어드민 화면의 MSW 워커)에서 주문을 한 번 받아 왔는지. failed면 받지 못해 이 브라우저 기록만 보입니다.
 */
type SyncState = "pending" | "synced" | "failed";
type Snapshot = { orders: AdminOrder[]; ready: boolean; now: number; sync: SyncState };
const EMPTY: Snapshot = { orders: [], ready: false, now: 0, sync: "pending" };
let syncState: SyncState = "pending";
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
  const key = `${stored}\u0000${shop}\u0000${syncState}`;
  if (cache?.key === key) return cache.value;
  // 주문은 서버에서 받아 더합니다(syncAdminOrders). 공개 데모의 시드 주문은 어드민 MSW 워커가 돌려줍니다.
  const orders = parseStored(stored) ?? [];
  const value = {
    orders: mergeOrders(orders, parseShopOrders(shop)),
    ready: true,
    now: Date.now(),
    sync: syncState,
  };
  cache = { key, value };
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

/** 서버에서 주문을 받아 온 결과를 기록합니다(api/sync.ts). */
export function setSyncState(state: SyncState) {
  syncState = state;
  cache = null;
  listeners.forEach((listener) => listener());
}

/** 데모 데이터 초기화: 저장한 어드민 주문을 지웁니다(쇼핑몰 주문 내역은 그대로). 다시 받아 오면 시드가 돌아옵니다. */
export function resetOrders() {
  localStorage.removeItem(ADMIN_ORDERS_KEY);
  setSyncState("pending");
}
