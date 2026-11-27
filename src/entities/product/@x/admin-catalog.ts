// entities/admin-catalog(어드민 상품 관리)가 쓰는 상품 원본·수정값 API (FSD의 @x 교차 공개 API).
// 맛 표(tastes)는 쇼핑몰 클라이언트 번들에 싣지 않는 표라, 어드민 번들에서만 이 경로로 읽습니다.
export { ALLERGENS, CATEGORIES, PRODUCTS, getProduct } from "../model/catalog";
export type { Allergen, Category, Product } from "../model/catalog";
export { TASTES } from "../model/taste-list";
export type { Taste } from "../model/taste-list";
export { productTastes } from "../model/tastes";
export {
  MAX_DISCOUNT,
  OVERRIDES_KEY,
  PRICE_RANGE,
  parseCatalogOverrides,
  salePriceUsd,
} from "../model/overrides";
export { formatCurrency } from "../lib/price";
export type { CatalogOverrides, ProductOverride } from "../model/overrides";
export { COUNTRY_NAMES } from "../lib/country-names";
