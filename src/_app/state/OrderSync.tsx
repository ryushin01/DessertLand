"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// 반영할 주문이 있을 때만 결과 반영 코드(조회·장바구니 갱신)를 받습니다. 대부분의 방문에는 받지 않습니다.
const SettleStripeOrders = dynamic(
  () => import("@/features/stripe-checkout").then((module) => module.SettleStripeOrders),
  { ssr: false },
);

/** entities/order가 주문을 저장하는 키. 공개 API를 불러오면 저장소 코드까지 모든 화면에 실리므로 키만 씁니다. */
const ORDERS_KEY = "dessert-land.orders";

const subscribeNothing = () => () => {};

function hasUnsettledStripeOrder(): boolean {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]");
    return (
      Array.isArray(value) &&
      value.some(
        (order: { kind?: unknown; settled?: unknown }) => order?.kind === "stripe" && order.settled === false,
      )
    );
  } catch {
    return false;
  }
}

/** 결제 뒤 완료 화면으로 돌아오지 못한 주문을 다음 방문 때 장바구니에 반영합니다. */
export function OrderSync() {
  // 서버 렌더링과 하이드레이션 중에는 false입니다.
  const needed = useSyncExternalStore(subscribeNothing, hasUnsettledStripeOrder, () => false);
  return needed ? <SettleStripeOrders /> : null;
}
