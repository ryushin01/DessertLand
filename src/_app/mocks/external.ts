import { setupServer } from "msw/node";

import { externalHandlers } from "./handlers";

/**
 * E2E 목업 서버(next start + E2E_MSW=1)에서만 씁니다. 서버가 바깥 서비스(Stripe·Claude·Sentry)로 보내는 요청을
 * 가로채 실제 결제·유료 API 호출 없이 키가 있는 흐름(Stripe Checkout, Claude 스트리밍, 어드민 Stripe 주문·환불)을 시험합니다.
 */
export function startExternalMocks() {
  setupServer(...externalHandlers).listen({ onUnhandledFrame: "bypass" });
}
