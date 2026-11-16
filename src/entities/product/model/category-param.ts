import { isCategory, type Category } from "./catalog";

/** 0.5.0 이전의 분류. 가장 가까운 새 분류로, "세계의 명작"(classic)은 맞는 분류가 없어 전체 목록으로 보냅니다. */
const LEGACY_CATEGORIES: Record<string, Category | null> = {
  milkshake: "drink",
  cheesecake: "cake",
  muffin: "baked",
  pancake: "griddle",
  creamcake: "cake",
  classic: null,
};

export type CategoryParam =
  | { type: "category"; category: Category }
  | { type: "legacy"; category: Category | null }
  | { type: "unknown" };

/** 상품 목록 주소의 ?category= 값을 해석합니다. */
export function resolveCategoryParam(value: string): CategoryParam {
  if (isCategory(value)) return { type: "category", category: value };
  if (Object.hasOwn(LEGACY_CATEGORIES, value)) {
    return { type: "legacy", category: LEGACY_CATEGORIES[value] ?? null };
  }
  return { type: "unknown" };
}
