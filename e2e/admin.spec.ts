import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

/**
 * 어드민 공개 데모(NEXT_PUBLIC_DEMO=1로 빌드)의 흐름: 데모 입장 → 상품 수정 → 쇼핑몰 반영, 주문 처리(단계·환불), 접근성.
 * 데이터는 이 브라우저 저장소에만 있으므로 테스트마다 새 브라우저 컨텍스트에서 시작합니다.
 */
async function scan(page: Page) {
  // 화면 전환 덮개(사선)가 걷힌 뒤에 검사합니다.
  await page.waitForTimeout(1500);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.target}`)).toEqual([]);
}

async function enterDemo(page: Page, next = "/admin") {
  await page.goto(next);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByRole("button", { name: "관리자로 둘러보기" }).click();
  // 들어간 뒤 이동은 서버 응답을 기다리므로, 부하가 큰 CI에서도 기다리도록 주소가 바뀔 때까지 봅니다.
  await page.waitForURL((url) => url.pathname === next);
}

test("어드민은 들어가기 전에는 막혀 있고, API도 세션 없이 열리지 않습니다", async ({
  page,
  request,
}) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproducts/);
  await expect(page).toHaveTitle("들어가기 | Dessert Land 어드민");
  await expect(page.getByText(/공개 데모입니다/)).toBeVisible();
  await scan(page);
  // 공개 데모에서는 Stripe 주문 읽기·환불 API를 열지 않습니다.
  expect((await request.get("/api/admin/orders")).status()).toBe(403);
  expect((await request.post("/api/admin/refunds", { data: {} })).status()).toBe(403);
});

test.describe("데모로 들어가면 화면마다 내용과 고유한 제목이 있고 접근성 위반이 없습니다", () => {
  const screens = [
    ["/admin", "대시보드", "인기 상품"],
    ["/admin/products", "상품", "175개 상품"],
    ["/admin/products/tiramisu", "tiramisu 상품 수정", "가격·재고"],
    ["/admin/orders", "주문", "결제 완료"],
    ["/admin/tastes", "맛·성분", "상품별로 지정하기"],
    ["/admin/recommendations", "AI 추천 기록", "자주 추천한 상품"],
  ] as const;
  for (const [path, title, text] of screens) {
    test(title, async ({ page }) => {
      await enterDemo(page, path);
      await expect(page).toHaveTitle(`${title} | Dessert Land 어드민`);
      await expect(page.getByRole("main")).toContainText(text);
      await expect(page.getByRole("link", { name: "본문 바로가기" })).toBeAttached();
      await scan(page);
    });
  }
});

test("상품을 고치면 같은 브라우저의 쇼핑몰에 이름·할인가·숨김이 반영되고, 초기화하면 돌아옵니다", async ({
  page,
}) => {
  await enterDemo(page, "/admin/products/baklava");
  const discount = page.getByLabel("할인율(%)");
  await discount.fill("50");
  await page.getByLabel("이름(한국어)").fill("어드민 바클라바");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("status").filter({ hasText: "쇼핑몰에 바로 반영" })).toBeVisible();

  await page.goto("/admin/products/tiramisu");
  await page.getByRole("checkbox", { name: /쇼핑몰에서 숨기기/ }).check();
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("status").filter({ hasText: "저장했습니다" })).toBeVisible();

  // 상세: 고친 이름과 할인가(원래 ₩9,800 → ₩4,900)
  await page.goto("/ko/shop/baklava");
  await expect(page.getByRole("heading", { level: 1, name: "어드민 바클라바" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("₩4,900");
  // 목록: 숨긴 티라미수는 빠지고 고친 이름으로 찾을 수 있음
  await page.goto("/ko/shop");
  await page.getByLabel("이름이나 나라로 찾기").fill("티라미수");
  await expect(page.getByText(/조건에 맞는 디저트가 없습니다/)).toBeVisible();
  await page.getByLabel("이름이나 나라로 찾기").fill("어드민");
  await expect(page.getByRole("link", { name: "어드민 바클라바", exact: true })).toBeVisible();
  // 결제 금액도 할인가로 서버가 확인합니다(공개 데모).
  await page.goto("/ko/checkout?buy=baklava&qty=1");
  await expect(page.getByRole("main")).toContainText("₩4,900");

  await page.goto("/admin");
  await page.getByRole("button", { name: "데모 데이터 초기화" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "초기화" }).click();
  await expect(page.getByRole("button", { name: "데모 데이터 초기화" })).toBeFocused();
  await page.goto("/ko/shop/baklava");
  await expect(page.getByRole("heading", { level: 1, name: "바클라바" })).toBeVisible();
});

test("주문 상태를 바꾸고 환불하면 처리 기록에 남고, 쇼핑몰에서 한 주문도 목록에 보입니다", async ({
  page,
}) => {
  // 이 브라우저의 쇼핑몰에서 내장 테스트 결제로 주문합니다.
  await page.goto("/ko/checkout?buy=macaron&qty=2");
  await page.getByLabel("받는 분 이름").fill("홍길동");
  await page.getByLabel("이메일").fill("demo@example.com");
  await page.getByLabel("배송 주소").fill("서울시 가상구 예시로 1");
  const stripe = page.getByRole("button", { name: /Stripe에서/ });
  if (await stripe.isVisible().catch(() => false))
    test.skip(true, "Stripe 키가 있는 빌드는 내장 결제를 쓰지 않습니다");
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await page
    .getByRole("dialog", { name: "테스트 결제창" })
    .getByRole("button", { name: "결제 승인" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" }),
  ).toBeVisible();

  await enterDemo(page, "/admin/orders");
  const shopOrder = page.getByRole("row").filter({ hasText: "이 브라우저의 쇼핑몰 주문" });
  await expect(shopOrder).toHaveCount(1);
  await shopOrder.getByRole("link").click();

  await page.getByRole("button", { name: "준비 중(으)로 바꾸기" }).click();
  await expect(page.getByRole("status").filter({ hasText: "준비 중" })).toBeVisible();

  const trigger = page.getByRole("button", { name: "환불하기" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(/환불 금액/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByLabel(/환불 금액/).fill("999999999");
  await dialog.getByRole("button", { name: "환불하기" }).click();
  await expect(dialog.getByLabel(/환불 금액/)).toHaveAttribute("aria-invalid", "true");
  await expect(dialog.getByLabel(/환불 금액/)).toBeFocused();
  await scan(page);
  await dialog.getByRole("button", { name: "취소" }).click();

  await trigger.click();
  await dialog.getByRole("button", { name: "환불하기" }).click();
  await expect(page.getByRole("status").filter({ hasText: "내장 테스트 결제 기록" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("환불 완료");
});

test("나가면 다시 들어가기 화면으로 갑니다", async ({ page, isMobile }) => {
  await enterDemo(page);
  if (isMobile) {
    await page.getByRole("button", { name: "메뉴" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "나가기" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "어드민 메뉴" })
      .getByRole("button", { name: "나가기" })
      .click();
  }
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("공개 데모의 MSW 워커는 어드민 범위에만 붙고 쇼핑몰 화면은 건드리지 않습니다", async ({
  page,
}) => {
  await enterDemo(page);
  await expect(page.getByRole("main")).toContainText("인기 상품");
  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/admin/");
    return { scope: registration?.scope ?? "", script: registration?.active?.scriptURL ?? "" };
  });
  expect(scope.scope).toMatch(/\/admin\/$/);
  expect(scope.script).toMatch(/\/admin\/mockServiceWorker\.js$/);
  await page.goto("/ko");
  expect(await page.evaluate(() => navigator.serviceWorker.controller === null)).toBe(true);
});
