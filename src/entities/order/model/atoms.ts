import { atom, useAtomValue } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useSyncExternalStore } from "react";

import { isSavedOrder, type SavedOrder } from "./saved-orders";

const json = createJSONStorage<SavedOrder[]>(() => localStorage);

/** 손댄 값이나 다른 모양의 값이 있어도 화면이 깨지지 않게 모양을 확인합니다. */
const sanitize = (value: unknown, fallback: SavedOrder[]): SavedOrder[] =>
  Array.isArray(value) ? value.filter(isSavedOrder) : fallback;

/** 읽을 때와, 다른 탭이 바꾼 값을 받을 때(subscribe) 모두 모양을 확인합니다. */
const storage: typeof json = {
  ...json,
  getItem: (key, initialValue) => sanitize(json.getItem(key, initialValue), initialValue),
  // 주문 내역 저장은 덤입니다. 저장 공간이 꽉 차는 등으로 실패해도 결제·장바구니 흐름을 막지 않습니다.
  setItem: (key, value) => {
    try {
      json.setItem(key, value);
    } catch {
      // 이번 주문은 주문 내역에 남지 않을 뿐입니다.
    }
  },
  subscribe: (key, callback, initialValue) =>
    json.subscribe?.(key, (value) => callback(sanitize(value, initialValue)), initialValue) ??
    (() => {}),
};

export const SAVED_ORDERS_KEY = "dessert-land.orders";
const KEY = SAVED_ORDERS_KEY;

/**
 * 이 브라우저에서 한 주문 목록. 서버 렌더링과 어긋나지 않도록 저장값은 이 atom을 구독하는 컴포넌트가 마운트될 때 읽습니다.
 * 바꿀 때는 updateSavedOrdersAtom을 씁니다(구독하지 않은 채 바꾸면 빈 목록 위에 써서 예전 주문을 덮어씀).
 */
export const savedOrdersAtom = atomWithStorage<SavedOrder[]>(KEY, [], storage);

/** 저장소의 최신 주문 목록. 서버에서는 빈 목록입니다. */
function readStoredOrders(): SavedOrder[] {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY) ?? "[]"), []);
  } catch {
    return [];
  }
}

/**
 * 저장한 주문을 바꿉니다. 주문 목록을 구독하는 컴포넌트가 없으면 atom은 아직 저장값을 읽지 않은 빈 목록이라,
 * 그대로 바꾸면 예전 주문을 덮어씁니다. 그래서 바꾸기 직전에 저장소에서 최신 값을 읽어 그 위에 적용합니다.
 * 다른 탭이 그사이 저장한 주문도 함께 남습니다.
 * 바꾼 뒤 저장소에 실제로 남은 목록을 돌려줍니다. 저장 공간 부족 등으로 쓰지 못하면(setItem이 오류를 삼킴) 바꾸기 전 목록입니다.
 */
export const updateSavedOrdersAtom = atom(
  null,
  (_get, set, update: (orders: SavedOrder[]) => SavedOrder[]): SavedOrder[] => {
    set(savedOrdersAtom, update(readStoredOrders()));
    return readStoredOrders();
  },
);

const subscribeNothing = () => () => {};

function storedCount(): number {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(isSavedOrder).length : 0;
  } catch {
    return 0;
  }
}

/**
 * 저장한 주문 목록과, 그 목록을 다 읽었는지 돌려줍니다.
 * 저장값은 마운트 뒤에 읽으므로, 읽기 전의 빈 목록을 "주문 없음"으로 잠깐 보여 주지 않으려고 씁니다.
 */
export function useSavedOrders(): { orders: SavedOrder[]; loaded: boolean } {
  const orders = useAtomValue(savedOrdersAtom);
  // 서버 렌더링과 하이드레이션 중에는 -1입니다.
  const stored = useSyncExternalStore(subscribeNothing, storedCount, () => -1);
  return { orders, loaded: stored === 0 || (stored > 0 && orders.length > 0) };
}
