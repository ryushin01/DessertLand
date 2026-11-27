// entities/admin-order가 주문 금액·인기 상품을 계산할 때 쓰는 상품·가격 API (FSD의 @x 교차 공개 API)
export { PRODUCTS, getProduct } from "../model/catalog";
export type { Category, Product } from "../model/catalog";
export { currencyForLocale, priceInCurrency, shippingInCurrency } from "../lib/price";
export type { Currency } from "../lib/price";
