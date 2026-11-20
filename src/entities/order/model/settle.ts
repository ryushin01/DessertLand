import { atom } from "jotai";

import { cartLinesAtom, deductPurchased, removePurchased, type CartLine } from "@/entities/cart/@x/order";

import { updateSavedOrdersAtom } from "./atoms";
import { settleOrders, type SavedOrder } from "./saved-orders";

/** 결과가 정해진 Stripe 주문. purchased는 서버가 세션에서 읽은 장바구니 주문의 상품 slug이고, 바로 구매면 빈 배열입니다. */
export type SettledStripeOrder = { sessionId: string; paid: boolean; purchased: readonly string[] };

type StripeOrder = Extract<SavedOrder, { kind: "stripe" }>;

/**
 * 결과가 정해진 Stripe 주문을 장바구니에 반영하고 반영됨으로 표시합니다. 완료 화면과 다음 방문(features/stripe-checkout의 useSettleStripeOrders)이 함께 씁니다.
 * 완료 화면이 결제 기능(features/stripe-checkout) 전체를 받지 않도록 주문 엔티티에 둡니다.
 * - 저장소의 최신 주문 목록에서 아직 반영하지 않은 주문만 반영하므로, 완료 화면과 다음 방문, 두 탭이 같은 주문을 반영해도 한 번만 뺍니다.
 * - 결제된 장바구니 주문은 결제 전에 저장한 수량만큼만 빼, 반영이 늦어지는 사이 다시 담은 같은 상품은 남깁니다.
 * - 수량을 저장하지 않은 예전 주문(1.0.1까지)과 이 브라우저에 기록이 없는 주문(저장 실패)은 서버가 알려 준 상품 줄을 통째로 뺍니다.
 */
export const settleStripeOrdersAtom = atom(
  null,
  (_get, set, results: readonly SettledStripeOrder[]) => {
    const deduct: CartLine[] = [];
    const remove: string[] = [];
    // 갱신 atom이 저장소의 최신 목록을 넘겨 한 번 부르므로, 그 목록으로 뺄 상품을 정하고 같은 자리에서 반영됨으로 바꿉니다.
    set(updateSavedOrdersAtom, (orders) => {
      for (const result of results) {
        if (!result.paid) continue;
        const order = orders.find(
          (item): item is StripeOrder => item.kind === "stripe" && item.sessionId === result.sessionId,
        );
        if (!order) {
          remove.push(...result.purchased);
          continue;
        }
        // 이미 반영한 주문과 바로 구매는 장바구니를 건드리지 않습니다.
        if (order.settled || order.source !== "cart") continue;
        if (order.items) deduct.push(...order.items);
        else remove.push(...result.purchased);
      }
      return settleOrders(
        orders,
        results.map((result) => result.sessionId),
      );
    });
    if (deduct.length > 0 || remove.length > 0) {
      set(cartLinesAtom, (lines) => removePurchased(deductPurchased(lines, deduct), remove));
    }
  },
);
