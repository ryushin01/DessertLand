// entities/order가 저장한 주문의 상품 줄을 나타내고, 결제 결과를 장바구니에 반영할 때 쓰는 API (FSD의 @x 교차 공개 API)
export { cartLinesAtom } from "../model/atoms";
export { deductPurchased, removePurchased } from "../model/lines";
export type { CartLine } from "../model/lines";
