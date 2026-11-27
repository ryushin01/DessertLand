import { HttpResponse, http } from "msw";

import { createSeedOrders } from "@/entities/admin-order";

/**
 * 어드민 API 목업. 공개 데모에서는 서버에 주문 저장소가 없으므로(공유 Stripe 샌드박스의 주문도 공개하지 않음),
 * 어드민 화면의 Service Worker(setupWorker)가 이 응답으로 대신합니다. 예전에 화면 코드 안에 있던 데모 대체 코드
 * (시드 주문 만들기, 데모 환불 기록)를 여기로 옮겼습니다. 데모가 꺼진 운영에서는 워커를 띄우지 않아 실제 API가 응답합니다.
 */
export const adminDemoHandlers = [
  // 시드 주문(지금 시각 기준 지난 30일, 같은 씨앗이면 같은 주문). 화면은 이미 있는 주문의 처리 기록을 지킵니다.
  http.get("/api/admin/orders", () =>
    HttpResponse.json({ status: "ok", orders: createSeedOrders(Date.now()) }),
  ),
  // 환불: 실제 결제가 없으므로 내장 테스트 결제 기록으로만 처리합니다.
  http.post("/api/admin/refunds", () =>
    HttpResponse.json({
      status: "refunded",
      id: `rf_test_${Date.now().toString(36)}`,
      method: "test",
    }),
  ),
];

/** 테스트·Storybook용: 어드민 들어가기(세션) 응답. 공개 데모는 실제 서버가 HttpOnly 쿠키를 넣어야 하므로 워커에는 넣지 않습니다. */
export const adminSessionHandlers = [
  http.get("/api/admin/session", () =>
    HttpResponse.json({ signedIn: false, demo: true, passwordEnabled: true }),
  ),
  http.post("/api/admin/session", async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const password =
      typeof body === "object" && body !== null && "password" in body ? body.password : null;
    if (password !== null && password !== "correct horse battery") {
      return HttpResponse.json({ status: "wrong" }, { status: 401 });
    }
    return HttpResponse.json({ status: "ok" });
  }),
  http.delete("/api/admin/session", () => HttpResponse.json({ status: "ok" })),
];
