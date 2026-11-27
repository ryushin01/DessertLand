import { HttpResponse, http } from "msw";

import { MOCK_RECOMMENDATION, mockSessionId } from "../fixtures";
import { chunkedStream } from "../stream";

/**
 * 이 앱의 API(브라우저가 부르는 쪽) 목업. 컴포넌트·훅 테스트(Vitest, jsdom)와 Storybook에서 씁니다.
 * 실제 서버 라우트를 대신해, 화면이 받는 응답 모양(상태 코드와 본문)만 흉내 냅니다.
 */
export const RECOMMEND_EVENTS = [
  {
    type: "update",
    intro: MOCK_RECOMMENDATION.intro,
    picks: MOCK_RECOMMENDATION.picks.slice(0, 1),
  },
  {
    type: "update",
    intro: MOCK_RECOMMENDATION.intro,
    picks: MOCK_RECOMMENDATION.picks.slice(0, 2),
  },
  {
    type: "done",
    source: "ai",
    intro: MOCK_RECOMMENDATION.intro,
    picks: MOCK_RECOMMENDATION.picks,
  },
];

/** 추천 응답(한 줄에 JSON 하나). 줄 중간에서도 조각이 나뉘게 잘라 보냅니다. */
export function recommendChunks(events: readonly unknown[] = RECOMMEND_EVENTS): string[] {
  const text = events.map((item) => `${JSON.stringify(item)}\n`).join("");
  const cut = Math.floor(text.length / 3);
  return [text.slice(0, cut), text.slice(cut, cut * 2), text.slice(cut * 2)];
}

export const appHandlers = [
  // 내장 테스트 결제: 받은 금액 그대로 승인(거절을 고르면 거절)
  http.post("/api/payments", async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const data = typeof body === "object" && body !== null ? body : {};
    if ("outcome" in data && data.outcome === "decline") {
      return HttpResponse.json({ status: "declined" }, { status: 402 });
    }
    const total =
      "expectedTotal" in data && typeof data.expectedTotal === "number" ? data.expectedTotal : 0;
    return HttpResponse.json({ status: "approved", orderNo: "DL-MSW0001", total });
  }),
  // Stripe 결제 세션: Stripe 결제 화면 주소를 돌려줌(실제로 열리지는 않음)
  http.post("/api/checkout-session", () => {
    const id = mockSessionId(1);
    return HttpResponse.json({
      status: "created",
      url: `https://checkout.stripe.com/c/pay/${id}`,
      id,
    });
  }),
  // 주문 조회: 받은 세션은 모두 결제 완료
  http.post("/api/orders", async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);
    const ids =
      typeof body === "object" && body !== null && "ids" in body && Array.isArray(body.ids)
        ? body.ids.filter((id): id is string => typeof id === "string")
        : [];
    return HttpResponse.json({
      status: "ok",
      orders: ids.map((sessionId, index) => ({
        sessionId,
        state: "paid",
        orderNo: `DL-MSW${index}`,
        total: 15000,
        currency: "KRW",
        createdAt: Date.now(),
        purchased: [],
      })),
    });
  }),
  // AI 추천: 한 줄에 JSON 하나씩, 조각으로 나눠 흘려보냄(서버가 Claude 스트림을 옮기는 모양)
  http.post(
    "/api/recommend",
    () =>
      new HttpResponse(chunkedStream(recommendChunks(), 120), {
        headers: { "content-type": "application/x-ndjson; charset=utf-8" },
      }),
  ),
];
