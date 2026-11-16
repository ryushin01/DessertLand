// 서버 코드(API 라우트)도 쓰는 주문 공개 API. index.ts는 클라이언트 훅(useSavedOrders)까지 내보내므로,
// 서버에서 불러도 되는 순수 함수만 여기서 내보냅니다.
export { isSessionId } from "./model/saved-orders";
