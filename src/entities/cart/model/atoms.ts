import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { countItems, type CartLine } from "./lines";

const storage = createJSONStorage<CartLine[]>(() => localStorage);

/** 서버 렌더링과 어긋나지 않도록 저장값은 마운트 후에 읽습니다. */
export const cartLinesAtom = atomWithStorage<CartLine[]>("dessert-world.cart", [], storage);
export const cartCountAtom = atom((get) => countItems(get(cartLinesAtom)));
export const cartOpenAtom = atom(false);
/** 스크린 리더에 알릴 최근 장바구니 메시지. */
export const cartAnnouncementAtom = atom("");
