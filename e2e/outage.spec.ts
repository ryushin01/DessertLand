import { MOCK_ADMIN_PASSWORD } from "./mock-env";
import { expect, test } from "./fixtures";
import { blockExternal, scan } from "./network";

/**
 * 키가 있는 배포본에서 Stripe·Claude가 끊겼을 때(E2E 장애 서버, E2E_MSW=outage).
 * 서버의 Stripe·Claude 요청은 MSW가 모두 네트워크 오류로 끊고, 브라우저의 바깥 요청도 끊습니다.
 * 결제는 내장 테스트 결제로, 추천은 기본 추천으로 넘어가고 완료·주문 화면도 비지 않아야 합니다.
 */
let blocked: string[] = [];

test.beforeEach(async ({ context }) => {
  blocked = await blockExternal(context);
});

test.afterEach(() => {
  expect(blocked).toEqual([]);
});

test("Stripe가 끊기면 알리고 내장 테스트 결제로 끝까지 진행해 주문 내역에 남깁니다", async ({
  page,
}) => {
  await page.goto("/ko/checkout?buy=baklava&qty=1");
  await expect(page.locator("main")).toContainText("Stripe 테스트 모드입니다");
  await page.getByRole("button", { name: /^Stripe에서 .+ 결제하기$/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "내장 테스트 결제로 바꿨습니다" }),
  ).toBeVisible();
  await scan(page);

  await page.getByLabel("받는 분 이름").fill("홍길동");
  await page.getByLabel("이메일").fill("demo@example.com");
  await page.getByLabel("배송 주소").fill("서울시 가상구 예시로 1");
  await page.getByRole("button", { name: /결제하기$/ }).click();
  const paymentDialog = page.getByRole("dialog", { name: "테스트 결제창" });
  await paymentDialog.getByRole("button", { name: "결제 승인" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" }),
  ).toBeVisible();

  await page.goto("/ko/orders");
  await expect(page.locator("main")).toContainText("테스트 결제");
});

test("Claude가 끊기면 기본 추천을 보여 줍니다", async ({ page }) => {
  await page.goto("/ko#advisor");
  const advisor = page.locator("#advisor");
  await advisor.getByLabel("원하는 디저트 설명").fill("상큼한 것");
  await advisor.getByRole("button", { name: "추천받기" }).click();
  const results = page.getByTestId("advisor-results");
  await expect(results).toContainText("기본 추천 (AI 미사용)");
  await expect(results.getByRole("listitem").first()).toBeVisible();
  await scan(page);
});

test("Stripe에서 돌아왔는데 확인할 수 없으면 완료 화면에 확인하지 못했다고 알립니다", async ({
  page,
}) => {
  await page.goto("/ko/checkout/complete?session_id=cs_test_outage00000001");
  await expect(page.getByRole("main")).toContainText("결제를 확인하지 못했습니다");
  await scan(page);
});

test("저장해 둔 Stripe 주문은 주문 내역에 '잠시 확인할 수 없음'으로 보입니다", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("dessert-land.orders")) return;
    localStorage.setItem(
      "dessert-land.orders",
      JSON.stringify([
        {
          kind: "stripe",
          sessionId: "cs_test_outage00000002",
          createdAt: Date.now(),
          source: "buy",
          settled: false,
          items: [{ slug: "baklava", quantity: 1 }],
        },
      ]),
    );
  });
  await page.goto("/ko/orders");
  await expect(page.getByRole("main")).toContainText("잠시 확인할 수 없음");
  await scan(page);
});

test("어드민 실제 인증: Stripe가 끊기면 주문 읽기·환불이 멈추지 않고 실패로 답합니다", async ({
  request,
}) => {
  const login = await request.post("/api/admin/session", {
    data: { mode: "password", password: MOCK_ADMIN_PASSWORD },
  });
  expect(login.status()).toBe(200);
  const orders = await request.get("/api/admin/orders");
  expect(orders.status()).toBe(502);
  expect(await orders.json()).toEqual({ status: "unavailable", orders: [] });
  const refund = await request.post("/api/admin/refunds", {
    data: {
      channel: "stripe",
      sessionId: "cs_test_outage00000003",
      amount: 13300,
      currency: "KRW",
    },
  });
  expect(await refund.json()).toEqual({ status: "failed" });
});
