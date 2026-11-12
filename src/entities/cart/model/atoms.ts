import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { countItems, selectLines, type CartLine } from "./lines";

const storage = createJSONStorage<CartLine[]>(() => localStorage);

/** 서버 렌더링과 어긋나지 않도록 저장값은 마운트 후에 읽습니다. */
export const cartLinesAtom = atomWithStorage<CartLine[]>("dessert-land.cart", [], storage);
/** 장바구니에서 주문하지 않기로 뺀 상품의 slug. 기본은 모두 주문에 넣습니다. */
export const cartExcludedAtom = atomWithStorage<string[]>(
  "dessert-land.cart-excluded",
  [],
  createJSONStorage<string[]>(() => localStorage),
);
/** 주문할 줄: 장바구니에서 뺀 상품을 제외합니다. */
export const selectedCartLinesAtom = atom((get) =>
  selectLines(get(cartLinesAtom), get(cartExcludedAtom)),
);
export const cartCountAtom = atom((get) => countItems(get(cartLinesAtom)));
export const cartOpenAtom = atom(false);
/** 스크린 리더에 알릴 최근 장바구니 메시지. */
export const cartAnnouncementAtom = atom("");
