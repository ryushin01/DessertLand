import { HttpResponse, http } from "msw";

import { mockSessionId } from "../fixtures";

/**
 * Stripe API(테스트 모드) 목업. 서버 코드(Node, Stripe SDK)의 요청을 받습니다.
 * Vitest(setupServer)와 E2E용 목업 서버(instrumentation, E2E_MSW=1)에서 씁니다. 실제 결제·환불은 일어나지 않습니다.
 * 만든 세션은 이 프로세스 메모리에만 두고, 결제가 끝난 것(paid)으로 돌려줍니다.
 */
const STRIPE = "https://api.stripe.com/v1";

type MockSession = {
  id: string;
  object: "checkout.session";
  url: string;
  status: "complete";
  payment_status: "paid";
  currency: string;
  amount_total: number;
  created: number;
  locale: string | null;
  metadata: Record<string, string>;
  payment_intent: string;
  success_url: string;
};

const sessions = new Map<string, MockSession>();
let counter = 0;

/** 폼 본문(line_items[0][price_data][unit_amount]=…)에서 금액·메타데이터를 읽습니다. */
function sessionFromForm(form: URLSearchParams): MockSession {
  counter += 1;
  const id = mockSessionId(Date.now() + counter);
  let amount = 0;
  for (let index = 0; form.has(`line_items[${index}][quantity]`); index += 1) {
    amount +=
      Number(form.get(`line_items[${index}][price_data][unit_amount]`) ?? 0) *
      Number(form.get(`line_items[${index}][quantity]`) ?? 0);
  }
  const metadata: Record<string, string> = {};
  for (const [key, value] of form) {
    const match = /^metadata\[(.+)\]$/.exec(key);
    if (match?.[1]) metadata[match[1]] = value;
  }
  return {
    id,
    object: "checkout.session",
    url: `https://checkout.stripe.com/c/pay/${id}`,
    status: "complete",
    payment_status: "paid",
    currency: form.get("line_items[0][price_data][currency]") ?? "usd",
    amount_total: amount,
    created: Math.floor(Date.now() / 1000),
    locale: form.get("locale"),
    metadata,
    payment_intent: `pi_test_msw${counter}`,
    success_url: form.get("success_url") ?? "",
  };
}

const missing = () =>
  HttpResponse.json(
    {
      error: {
        type: "invalid_request_error",
        code: "resource_missing",
        message: "No such checkout.session",
      },
    },
    { status: 404 },
  );

export const stripeHandlers = [
  http.post(`${STRIPE}/checkout/sessions`, async ({ request }) => {
    const session = sessionFromForm(new URLSearchParams(await request.text()));
    sessions.set(session.id, session);
    return HttpResponse.json(session);
  }),
  http.get(`${STRIPE}/checkout/sessions/:id`, ({ params }) => {
    const session = typeof params.id === "string" ? sessions.get(params.id) : undefined;
    return session ? HttpResponse.json(session) : missing();
  }),
  http.get(`${STRIPE}/checkout/sessions`, () =>
    HttpResponse.json({
      object: "list",
      url: "/v1/checkout/sessions",
      has_more: false,
      data: [...sessions.values()].reverse(),
    }),
  ),
  http.post(`${STRIPE}/refunds`, async ({ request }) => {
    const form = new URLSearchParams(await request.text());
    counter += 1;
    return HttpResponse.json({
      id: `re_test_msw${counter}`,
      object: "refund",
      amount: Number(form.get("amount") ?? 0),
      payment_intent: form.get("payment_intent"),
      status: "succeeded",
    });
  }),
];

/** 테스트가 미리 결제된 세션을 넣을 때 씁니다. */
export function seedStripeSession(session: Partial<MockSession> & { id: string }) {
  sessions.set(session.id, {
    object: "checkout.session",
    url: `https://checkout.stripe.com/c/pay/${session.id}`,
    status: "complete",
    payment_status: "paid",
    currency: "krw",
    amount_total: 0,
    created: Math.floor(Date.now() / 1000),
    locale: "ko",
    metadata: { app: "dessert-land", source: "cart" },
    payment_intent: `pi_test_${session.id}`,
    success_url: "",
    ...session,
  });
}

export const resetStripeSessions = () => sessions.clear();
