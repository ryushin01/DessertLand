import type { Allergen, Product, Taste } from "@/entities/product";

export type ShopFilters = {
  /** 이름(그 언어)·나라·영문 slug에서 찾습니다. */
  query: string;
  /** 이 성분이 든 상품을 뺍니다. */
  excluded: readonly Allergen[];
  /** 고른 맛 중 하나라도 있는 상품만 남깁니다. 비어 있으면 거르지 않습니다. */
  tastes: readonly Taste[];
};

export const NO_FILTERS: ShopFilters = { query: "", excluded: [], tastes: [] };

/** 대소문자와 라틴 문자 악센트(é, ù 등)를 무시하고 비교합니다. 한글·가나는 그대로 둡니다. */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC").toLocaleLowerCase().trim();
}

type Words = {
  name: (slug: string) => string;
  country: (product: Product) => string;
  /** 상품의 맛. 맛 표는 서버에만 있어 목록 화면이 속성으로 받습니다. */
  tastes: (slug: string) => readonly Taste[];
};

export function filterProducts(
  products: readonly Product[],
  { query, excluded, tastes }: ShopFilters,
  words: Words,
): Product[] {
  const needle = foldText(query);
  return products.filter((product) => {
    if (product.allergens.some((allergen) => excluded.includes(allergen))) return false;
    if (tastes.length > 0 && !words.tastes(product.slug).some((taste) => tastes.includes(taste))) {
      return false;
    }
    if (!needle) return true;
    // 영문 slug는 하이픈 그대로(new-york-cheesecake)와 띄어 쓴 꼴(new york cheesecake) 모두로 찾습니다.
    const haystack = [
      words.name(product.slug),
      words.country(product),
      product.slug,
      product.slug.replaceAll("-", " "),
    ];
    return haystack.some((text) => foldText(text).includes(needle));
  });
}

export function hasFilters({ query, excluded, tastes }: ShopFilters): boolean {
  return query.trim().length > 0 || excluded.length > 0 || tastes.length > 0;
}
