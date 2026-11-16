import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import { savedOrdersAtom, updateSavedOrdersAtom } from "./atoms";
import { addSavedOrder, type SavedOrder } from "./saved-orders";

const KEY = "dessert-land.orders";
const demo = (orderNo: string, createdAt = Date.UTC(2026, 10, 1)): SavedOrder => ({
  kind: "demo",
  orderNo,
  createdAt,
  total: 22,
  locale: "en",
  items: [{ slug: "baklava", quantity: 2 }],
});
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedOrder[];

describe("저장한 주문 atom", () => {
  beforeEach(() => localStorage.clear());

  it("주문 목록을 구독하지 않은 화면에서 더해도 예전 주문을 덮어쓰지 않습니다", () => {
    // 다른 날 저장한 주문 둘. 새 store는 아직 저장값을 읽지 않았습니다(구독 전이라 빈 목록).
    localStorage.setItem(KEY, JSON.stringify([demo("DL-OLD2"), demo("DL-OLD1")]));
    const store = createStore();
    expect(store.get(savedOrdersAtom)).toEqual([]);

    store.set(updateSavedOrdersAtom, (orders) => addSavedOrder(orders, demo("DL-NEW", Date.UTC(2026, 10, 2))));
    expect(stored().map((order) => (order.kind === "demo" ? order.orderNo : ""))).toEqual([
      "DL-NEW",
      "DL-OLD2",
      "DL-OLD1",
    ]);
  });

  it("다른 탭이 모양이 다른 값을 써도 빈 목록으로 받습니다", () => {
    const store = createStore();
    const unsubscribe = store.sub(savedOrdersAtom, () => {});
    window.dispatchEvent(
      new StorageEvent("storage", { key: KEY, newValue: "{}", storageArea: localStorage }),
    );
    expect(store.get(savedOrdersAtom)).toEqual([]);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: KEY,
        newValue: JSON.stringify([demo("DL-1"), { kind: "demo", createdAt: 1 }]),
        storageArea: localStorage,
      }),
    );
    expect(store.get(savedOrdersAtom)).toEqual([demo("DL-1")]);
    unsubscribe();
  });
});
