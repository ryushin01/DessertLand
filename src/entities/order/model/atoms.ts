import { useAtomValue } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useSyncExternalStore } from "react";

import { isSavedOrder, type SavedOrder } from "./saved-orders";

const json = createJSONStorage<SavedOrder[]>(() => localStorage);

/** 손댄 값이나 다른 모양의 값이 있어도 화면이 깨지지 않게, 읽을 때 모양을 확인합니다. */
const storage: typeof json = {
  ...json,
  getItem: (key, initialValue) => {
    const value = json.getItem(key, initialValue);
    return Array.isArray(value) ? value.filter(isSavedOrder) : initialValue;
  },
};

const KEY = "dessert-land.orders";

/** 이 브라우저에서 한 주문 목록. 서버 렌더링과 어긋나지 않도록 저장값은 마운트 후에 읽습니다. */
export const savedOrdersAtom = atomWithStorage<SavedOrder[]>(KEY, [], storage);

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
