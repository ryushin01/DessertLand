"use client";

import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

import { cartLinesAtom, removePurchased } from "@/entities/cart";
import { pendingStripeOrders, savedOrdersAtom, settleOrders } from "@/entities/order";

import { lookupOrders } from "../api/lookupOrders";

/** 같은 탭에서 너무 자주 묻지 않도록, 결과가 아직 없는 주문은 이 간격이 지나야 다시 묻습니다. */
const RECHECK_MS = 10 * 60 * 1000;
const CHECKED_KEY = "dessert-land.orders-checked";

function recentlyChecked(now: number): boolean {
  try {
    return now - Number(sessionStorage.getItem(CHECKED_KEY) ?? 0) < RECHECK_MS;
  } catch {
    return false;
  }
}

function markChecked(now: number): void {
  try {
    sessionStorage.setItem(CHECKED_KEY, String(now));
  } catch {
    // 저장이 막혀 있으면 다음에 다시 물을 뿐입니다.
  }
}

/**
 * Stripe에서 결제를 마친 뒤 완료 화면으로 돌아오지 못한 주문(창을 닫음, 네트워크 끊김 등)을
 * 다음 방문 때 확인해, 산 상품을 장바구니에서 빼고 주문을 반영됨으로 표시합니다.
 * 만료되었거나 이 사이트 세션이 아니면 반영할 것이 없으므로 반영됨으로만 표시합니다.
 */
export function useSettleStripeOrders(): void {
  const [orders, setOrders] = useAtom(savedOrdersAtom);
  const setCart = useSetAtom(cartLinesAtom);
  const requested = useRef(new Set<string>());

  useEffect(() => {
    const now = Date.now();
    const pending = pendingStripeOrders(orders, now).filter(
      (order) => !requested.current.has(order.sessionId),
    );
    if (pending.length === 0 || recentlyChecked(now)) return;
    for (const order of pending) requested.current.add(order.sessionId);
    markChecked(now);

    void lookupOrders(pending.map((order) => order.sessionId)).then((results) => {
      if (!results) return;
      const settled: string[] = [];
      const purchased: string[] = [];
      for (const result of results) {
        const order = pending.find((item) => item.sessionId === result.sessionId);
        if (!order || result.state === "open") continue;
        settled.push(result.sessionId);
        if (result.state === "paid" && order.source === "cart")
          purchased.push(...(result.purchased ?? []));
      }
      if (purchased.length > 0) setCart((lines) => removePurchased(lines, purchased));
      if (settled.length > 0) setOrders((current) => settleOrders(current, settled));
    });
  }, [orders, setOrders, setCart]);
}
