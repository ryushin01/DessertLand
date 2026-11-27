import { OTHER_COUNTRY, PRODUCTS, type Product } from "@/entities/product";
import { productCoordinates } from "@/entities/product/index.server";

export type WorldStop = Product & { coordinates: string };

/** 가로 여행이 너무 길어지지 않게, 나라마다 첫 상품 하나씩 16곳까지만 들릅니다. 기타(XX)는 들르지 않습니다. */
const MAX_STOPS = 16;

/**
 * 세계 여행에 들를 상품과 좌표. 서버(HomePage)에서 골라 속성으로 넘겨, 175종의 좌표가 클라이언트 번들에 실리지 않게 합니다.
 */
export function worldStops(): WorldStop[] {
  return PRODUCTS.filter(
    (product, index) =>
      product.country !== OTHER_COUNTRY &&
      PRODUCTS.findIndex((item) => item.country === product.country) === index,
  )
    .slice(0, MAX_STOPS)
    .map((product) => ({ ...product, coordinates: productCoordinates(product.slug) }));
}
