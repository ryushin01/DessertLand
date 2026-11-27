import { HttpResponse, http } from "msw";

/**
 * 바깥 서비스 장애 목업. Stripe·Claude에 가는 서버 요청을 모두 네트워크 오류로 끊습니다(연결 실패와 같음).
 * 키가 있는 배포본에서 Stripe·Claude가 끊겼을 때 화면이 내장 테스트 결제·기본 추천으로 넘어가는지
 * E2E 장애 서버(src/instrumentation.ts, E2E_MSW=outage)와 Vitest에서 봅니다.
 */
export const outageHandlers = [
  http.all("https://api.stripe.com/*", () => HttpResponse.error()),
  http.all("https://api.anthropic.com/*", () => HttpResponse.error()),
];
