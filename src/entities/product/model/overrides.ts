import { ALLERGENS, type Allergen, type Product } from "./catalog";
import { TASTES, type Taste } from "./taste-list";

/**
 * 어드민이 상품에 덧씌운 값. 상품 원본(catalog.ts, 메시지 파일)은 그대로 두고 바뀐 칸만 담습니다.
 * - discount: 할인율(%), stock: 남은 수량(없으면 수량 제한 없음, 0이면 품절)
 * - name·description: 언어 코드별 문구(없는 언어는 메시지 파일의 원래 문구)
 */
export type ProductOverride = {
  hidden?: boolean;
  priceUsd?: number;
  discount?: number;
  stock?: number;
  name?: Record<string, string>;
  description?: Record<string, string>;
  allergens?: Allergen[];
  tastes?: Taste[];
};

export type CatalogOverrides = Record<string, ProductOverride>;

/** 어드민이 고친 상품 값을 두는 브라우저 저장소 키. 같은 주소(출처)의 쇼핑몰이 읽습니다. */
export const OVERRIDES_KEY = "dessert-land.catalog";

/** 쇼핑몰에 보이는 상품. priceUsd는 할인을 적용한 판매가이고, 할인 중이면 listPriceUsd가 원래 값입니다. */
export type ShopProduct = Product & { listPriceUsd?: number; soldOut?: boolean };

/** 가격·할인율 범위. 어드민 입력 검사와 서버의 데모 가격 확인이 함께 씁니다. */
export const PRICE_RANGE = { min: 0.5, max: 500 } as const;
export const MAX_DISCOUNT = 90;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** min~max 사이의 수(NaN·무한대는 비교에서 걸러짐). */
const numberIn = (value: unknown, min: number, max: number) =>
  typeof value === "number" && value >= min && value <= max ? value : undefined;

const texts = (value: unknown) =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      )
    : undefined;

const listOf = <T extends string>(value: unknown, allowed: readonly T[]) =>
  Array.isArray(value) ? allowed.filter((item) => value.includes(item)) : undefined;

/**
 * 브라우저 저장소·요청 본문에서 읽은 값을 확인합니다. 모양이 다른 칸은 버리고(undefined) 맞는 칸만 남깁니다.
 * 쇼핑몰 번들에도 실리므로 검사 라이브러리 없이 짧게 씁니다(어드민 입력은 zod로 따로 검사).
 */
export function parseCatalogOverrides(value: unknown): CatalogOverrides {
  const result: CatalogOverrides = {};
  if (!isRecord(value)) return result;
  for (const [slug, item] of Object.entries(value)) {
    if (!isRecord(item)) continue;
    const stock = numberIn(item.stock, 0, 1e6);
    result[slug] = {
      hidden: item.hidden === true,
      priceUsd: numberIn(item.priceUsd, PRICE_RANGE.min, PRICE_RANGE.max),
      discount: numberIn(item.discount, 0, MAX_DISCOUNT),
      stock: stock === undefined ? undefined : Math.floor(stock),
      name: texts(item.name),
      description: texts(item.description),
      allergens: listOf(item.allergens, ALLERGENS),
      tastes: listOf(item.tastes, TASTES),
    };
  }
  return result;
}

/** 할인을 적용한 판매가(달러, 센트 단위 반올림). */
export function salePriceUsd(
  product: Pick<Product, "priceUsd">,
  override?: ProductOverride,
): number {
  const base = override?.priceUsd ?? product.priceUsd;
  return Math.round(base * (100 - (override?.discount ?? 0))) / 100;
}

/** 어드민 수정값을 덧씌운 상품. 수정값이 없으면 원래 상품을 그대로 돌려줍니다. */
export function applyOverride(product: Product, override?: ProductOverride): ShopProduct {
  if (!override) return product;
  const priceUsd = salePriceUsd(product, override);
  const listPriceUsd = override.priceUsd ?? product.priceUsd;
  return {
    ...product,
    priceUsd,
    allergens: override.allergens ?? product.allergens,
    ...(priceUsd < listPriceUsd ? { listPriceUsd } : {}),
    ...(override.stock === 0 ? { soldOut: true } : {}),
  };
}

/** 쇼핑몰 목록: 숨긴 상품을 빼고 수정값을 덧씌웁니다. */
export const applyOverrides = (products: readonly Product[], overrides: CatalogOverrides) =>
  products
    .filter((product) => !overrides[product.slug]?.hidden)
    .map((product) => applyOverride(product, overrides[product.slug]));

/**
 * 서버: 결제 요청 본문의 가격 수정값. 공개 데모 빌드에서만 받고(누구나 고칠 수 있는 테스트 결제), 그 밖에는 늘 카탈로그 가격입니다.
 */
export function demoPricing(value: unknown, demo: boolean): CatalogOverrides {
  return demo ? parseCatalogOverrides(value) : {};
}
