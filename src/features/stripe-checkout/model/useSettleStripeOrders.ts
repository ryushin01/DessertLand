"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

import {
  pendingStripeOrders,
  savedOrdersAtom,
  settleStripeOrdersAtom,
  type SettledStripeOrder,
} from "@/entities/order";

import { lookupOrders } from "../api/lookupOrders";
import { isSettledState } from "./order-lookup";

/** 같은 탭에서 너무 자주 묻지 않도록, 결과가 아직 없는 주문은 이 간격이 지나야 다시 묻습니다. */
export const RECHECK_MS = 10 * 60 * 1000;
const CHECKED_KEY = "dessert-land.orders-checked";

/** 마지막으로 물은 뒤 다시 물을 수 있을 때까지 남은 시간(밀리초). 0이면 바로 물어도 됩니다. */
function recheckDelay(now: number): number {
  try {
    const checked = Number(sessionStorage.getItem(CHECKED_KEY) ?? 0);
    return Math.max(0, RECHECK_MS - (now - checked));
  } catch {
    return 0;
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
 * 다음 방문 때 확인해, 산 수량만큼 장바구니에서 빼고 주문을 반영됨으로 표시합니다(settleStripeOrdersAtom).
 * 만료되었거나 이 사이트 세션이 아니면 반영할 것이 없으므로 반영됨으로만 표시합니다.
 * 결제 중(open)이거나 잠시 조회하지 못한(unavailable) 주문은 재확인 간격이 지나면 다시 묻습니다.
 */
export function useSettleStripeOrders(): void {
  const orders = useAtomValue(savedOrdersAtom);
  const settle = useSetAtom(settleStripeOrdersAtom);
  // 지금 묻고 있는 주문. 결과가 정해지지 않으면 다시 물을 수 있게 뺍니다.
  const requested = useRef(new Set<string>());
  // 재확인 간격이 지나면 늘려 이 효과를 다시 돌립니다.
  const [round, setRound] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const pending = pendingStripeOrders(orders, now).filter(
      (order) => !requested.current.has(order.sessionId),
    );
    if (pending.length === 0) return;

    let retry: ReturnType<typeof setTimeout> | undefined;
    const delay = recheckDelay(now);
    if (delay > 0) {
      retry = setTimeout(() => setRound((value) => value + 1), delay);
      return () => clearTimeout(retry);
    }

    for (const order of pending) requested.current.add(order.sessionId);
    markChecked(now);

    void lookupOrders(pending.map((order) => order.sessionId)).then((results) => {
      const settled: SettledStripeOrder[] = [];
      for (const order of pending) {
        const result = results?.find((item) => item.sessionId === order.sessionId);
        if (!result || !isSettledState(result.state)) {
          requested.current.delete(order.sessionId);
          continue;
        }
        settled.push({
          sessionId: order.sessionId,
          paid: result.state === "paid",
          purchased: result.purchased ?? [],
        });
      }
      if (settled.length > 0) settle(settled);
      if (settled.length < pending.length) {
        retry = setTimeout(() => setRound((value) => value + 1), RECHECK_MS);
      }
    });

    return () => {
      if (retry) clearTimeout(retry);
    };
  }, [orders, round, settle]);
}
