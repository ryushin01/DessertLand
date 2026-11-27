import {
  PRODUCTS,
  productTastes,
  salePriceUsd,
  type Allergen,
  type CatalogOverrides,
  type Category,
  type Taste,
} from "@/entities/product/@x/admin-catalog";

import type { CustomProduct } from "./schema";

/** 어드민 상품 목록의 한 줄: 원본 + 수정값 + (새 상품이면) 추가한 값. */
export type AdminProductRow = {
  slug: string;
  name: string;
  category: Category;
  country: string;
  image: string | null;
  basePriceUsd: number;
  priceUsd: number;
  salePriceUsd: number;
  discount: number;
  /** null이면 수량 제한 없음 */
  stock: number | null;
  hidden: boolean;
  custom: boolean;
  edited: boolean;
  allergens: Allergen[];
  tastes: Taste[];
};

export type ProductState = "onSale" | "soldOut" | "hidden";

export const productState = (row: AdminProductRow): ProductState =>
  row.hidden ? "hidden" : row.stock === 0 ? "soldOut" : "onSale";

export const PRODUCT_STATE_LABELS: Record<ProductState, string> = {
  onSale: "판매 중",
  soldOut: "품절",
  hidden: "숨김",
};

/**
 * 상품 목록. names는 한국어 이름(slug → 이름), 아직 받지 않았으면 slug를 보여 줍니다.
 * 새 상품은 처음에 숨김(쇼핑몰에 없음)이고 이름은 수정값의 한국어 이름입니다.
 */
export function buildRows(
  overrides: CatalogOverrides,
  custom: readonly CustomProduct[],
  names: Record<string, { name: string }> | null,
): AdminProductRow[] {
  const base = PRODUCTS.map((product) => ({
    ...product,
    image: product.image.src as string | null,
    tastes: productTastes(product.slug),
    custom: false,
  }));
  const added = custom.map((product) => ({
    ...product,
    image: null,
    allergens: [] as Allergen[],
    tastes: [] as Taste[],
    custom: true,
  }));
  return [...base, ...added].map((product) => {
    const override = overrides[product.slug];
    return {
      slug: product.slug,
      name: override?.name?.ko || names?.[product.slug]?.name || product.slug,
      category: product.category,
      country: product.country,
      image: product.image,
      basePriceUsd: product.priceUsd,
      priceUsd: override?.priceUsd ?? product.priceUsd,
      salePriceUsd: salePriceUsd(product, override),
      discount: override?.discount ?? 0,
      stock: override?.stock ?? null,
      // 새 상품은 쇼핑몰의 정적 페이지·서버 가격표에 없어 늘 숨김(어드민에만 보임)입니다.
      hidden: product.custom || (override?.hidden ?? false),
      custom: product.custom,
      edited: override !== undefined && Object.keys(override).length > 0,
      allergens: override?.allergens ?? product.allergens,
      tastes: override?.tastes ?? product.tastes,
    };
  });
}

export type ProductQuery = {
  text: string;
  category: Category | "";
  country: string;
  state: ProductState | "";
};

export const NO_PRODUCT_QUERY: ProductQuery = { text: "", category: "", country: "", state: "" };

/** 이름·slug 찾기(대소문자 무시)와 분류·나라·상태 거르기. */
export function filterRows(
  rows: readonly AdminProductRow[],
  query: ProductQuery,
): AdminProductRow[] {
  const text = query.text.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (!text || row.name.toLowerCase().includes(text) || row.slug.includes(text)) &&
      (!query.category || row.category === query.category) &&
      (!query.country || row.country === query.country) &&
      (!query.state || productState(row) === query.state),
  );
}
