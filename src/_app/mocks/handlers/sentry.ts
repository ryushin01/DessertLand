import { HttpResponse, http } from "msw";

/**
 * Sentry 목업. 서버의 중계(`/api/monitoring` → Sentry envelope 주소)가 보내는 곳과, 브라우저가 보내는 같은 사이트 중계 주소를 받습니다.
 * 받은 묶음은 버리고 200만 돌려줍니다.
 */
export const sentryHandlers = [
  http.post(
    "https://*.ingest.sentry.io/api/:project/envelope/",
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.post("/api/monitoring", () => new HttpResponse(null, { status: 200 })),
];
