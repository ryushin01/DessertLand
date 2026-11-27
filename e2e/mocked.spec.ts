import { MOCK_ADMIN_PASSWORD } from "./mock-env";
import { expect, test } from "./fixtures";

/**
 * MSW 목업 서버(E2E_MSW=1)에서 키가 있는 흐름을 봅니다. 서버의 Stripe·Claude 요청은 src/_app/mocks가 받습니다.
 * 실제 결제·환불·유료 API 호출은 일어나지 않습니다.
 */

test("Stripe 테스트 결제: 결제 화면으로 갔다가 돌아오면 Stripe에서 확인한 주문 완료를 보여 줍니다", async ({
  page,
  baseURL,
}) => {
  // Stripe 결제 화면(외부)은 열지 않고, 결제를 마친 것처럼 완료 주소로 돌려보냅니다.
  await page.route("https://checkout.stripe.com/**", (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop() ?? "";
    return route.fulfill({
      contentType: "text/html",
      body: `<script>location.replace(${JSON.stringify(`${baseURL}/ko/checkout/complete?session_id=${id}`)})</script>`,
    });
  });
  await page.goto("/ko/checkout?buy=baklava&qty=1");
  await page.getByRole("button", { name: /Stripe/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("DL-");

  await page.goto("/ko/orders");
  await expect(page.getByRole("main")).toContainText("결제 완료");
});

test("Claude 추천: 조각으로 오는 스트림을 받아 AI 추천으로 보여 줍니다", async ({ page }) => {
  await page.goto("/ko#advisor");
  const advisor = page.locator("#advisor");
  await advisor.getByLabel("원하는 디저트 설명").fill("커피랑 먹을 디저트");
  await advisor.getByRole("button", { name: "추천받기" }).click();
  const results = page.getByTestId("advisor-results");
  await expect(results).toContainText("Claude AI 추천");
  await expect(results).toContainText("티라미수");
  await expect(results.getByRole("listitem")).toHaveCount(3);
});

test("어드민 실제 인증: 비밀번호로 들어가 Stripe 주문을 읽고 테스트 모드로 환불합니다", async ({
  request,
}) => {
  // 바로 구매 1개(바클라바 ₩9,800 + 배송 ₩3,500)로 Stripe 세션을 만듭니다.
  const created = await request.post("/api/checkout-session", {
    data: {
      items: [{ slug: "baklava", quantity: 1 }],
      locale: "ko",
      expectedTotal: 13300,
      source: "buy",
    },
  });
  const { id } = (await created.json()) as { id: string };
  expect(id).toMatch(/^cs_test_/);

  expect(
    (
      await request.post("/api/admin/session", { data: { mode: "password", password: "wrong" } })
    ).status(),
  ).toBe(401);
  const login = await request.post("/api/admin/session", {
    data: { mode: "password", password: MOCK_ADMIN_PASSWORD },
  });
  expect(login.status()).toBe(200);

  const orders = (await (await request.get("/api/admin/orders")).json()) as {
    orders: { id: string; total: number; origin: string }[];
  };
  expect(orders.orders.find((order) => order.id === id)).toMatchObject({
    total: 13300,
    origin: "stripe",
  });

  const refund = await request.post("/api/admin/refunds", {
    data: { channel: "stripe", sessionId: id, amount: 13300, currency: "KRW" },
  });
  expect(await refund.json()).toMatchObject({ status: "refunded", method: "stripe" });
});
