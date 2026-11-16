"use client";

import { useSettleStripeOrders } from "../model/useSettleStripeOrders";

/** 결제 뒤 완료 화면으로 돌아오지 못한 주문을 장바구니에 반영합니다. 화면에는 아무것도 그리지 않습니다. */
export function SettleStripeOrders() {
  useSettleStripeOrders();
  return null;
}
