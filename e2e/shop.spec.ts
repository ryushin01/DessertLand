import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { LOCALES } from "../src/shared/i18n/routing";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.target}`)).toEqual([]);
}

test.describe("언어", () => {
  for (const locale of LOCALES) {
    test(`${locale} 홈은 언어 속성과 소개 문구를 제공합니다`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1, name: "Dessert Land" })).toBeVisible();
      await expect(page.locator("main")).toContainText("10");
      await expectNoHorizontalOverflow(page);
    });
  }

  test.describe("지원하지 않는 언어의 브라우저", () => {
    test.use({ locale: "ar-EG" });

    test("/ 는 기본 언어인 한국어로 이동합니다", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/ko$/);
    });
  });

  test.describe("지원하는 언어의 브라우저", () => {
    test.use({ locale: "ja-JP" });

    test("/ 는 브라우저 언어로 이동합니다", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/ja$/);
    });
  });
});

test.describe("모션 켜짐 접근성", () => {
  test("홈", async ({ page }) => {
    await page.goto("/ko");
    await page.waitForTimeout(3200);
    await scan(page);
  });

  test("상품 목록", async ({ page }) => {
    await page.goto("/ko/shop");
    await page.waitForTimeout(1500);
    await scan(page);
    await expectNoHorizontalOverflow(page);
  });

  test("상품 상세", async ({ page }) => {
    await page.goto("/ja/shop/baklava");
    await page.waitForTimeout(2000);
    await scan(page);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("움직임 줄이기", () => {
  test.use({ reducedMotion: "reduce" });

  test("홈 전체를 스크롤해도 넘치지 않고 접근성 위반이 없습니다", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(500);
    await scan(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  });
});

test("사용자가 움직임을 멈출 수 있습니다", async ({ page }) => {
  await page.goto("/ko");
  await page.getByRole("button", { name: "움직임 멈추기" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.reload();
  await expect(page.getByRole("button", { name: "움직임 재생" })).toBeVisible();
});

test("언어를 바꿔도 같은 상품에 머무릅니다", async ({ page }) => {
  await page.goto("/ko/shop/tiramisu");
  await page.getByText("KO", { exact: true }).click();
  await page.getByRole("banner").getByRole("link", { name: "Italiano" }).click();
  await expect(page).toHaveURL(/\/it\/shop\/tiramisu$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tiramisù" })).toBeVisible();
});

test("필터로 카테고리를 좁힙니다", async ({ page }) => {
  await page.goto("/ko/shop");
  await page.getByRole("navigation", { name: "카테고리 선택" }).getByRole("link", { name: "머핀" }).click();
  await expect(page).toHaveURL(/category=muffin/);
  await expect(page.getByRole("status").filter({ hasText: "2개의 디저트" })).toBeVisible();
});

async function fillCheckout(page: Page) {
  await page.getByLabel("받는 분 이름").fill("홍길동");
  await page.getByLabel("이메일").fill("demo@example.com");
  await page.getByLabel("배송 주소").fill("서울시 가상구 예시로 1");
}

test("장바구니에 담아 결제까지 마치면 장바구니가 비워집니다", async ({ page }) => {
  await page.goto("/ko/shop/baklava");
  await page.getByRole("button", { name: "수량 늘리기" }).click();
  await page.getByRole("button", { name: "장바구니에 담기" }).click();

  const dialog = page.getByRole("dialog", { name: "장바구니" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("바클라바");
  await scan(page);

  await dialog.getByRole("link", { name: "주문하기" }).click();
  await expect(page).toHaveURL(/\/ko\/checkout$/);

  const pay = page.getByRole("button", { name: /결제하기$/ });
  await expect(pay).toContainText("23,100");
  await pay.click();
  await expect(page.getByText("입력 내용을 확인해 주세요.")).toBeVisible();
  await expect(page.getByLabel("받는 분 이름")).toBeFocused();
  await scan(page);

  await fillCheckout(page);
  await page.getByRole("radio", { name: "간편결제" }).check();
  await pay.click();
  const paymentDialog = page.getByRole("dialog", { name: "테스트 결제창" });
  await expect(paymentDialog).toContainText("23,100");
  await scan(page);
  await paymentDialog.getByRole("button", { name: "결제 승인" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" })).toBeFocused();
  await expect(page.locator("main")).toContainText("결제 금액: ₩23,100");
  await expect(page.locator("main")).toContainText("결제 수단: 간편결제");
  await expect(page.getByRole("button", { name: "장바구니", exact: true })).toBeVisible();
});

test("바로 구매는 그 상품만 결제하고 장바구니를 유지합니다", async ({ page }) => {
  await page.goto("/ko/shop/tiramisu");
  await page.getByRole("button", { name: "장바구니에 담기" }).click();
  await page.getByRole("button", { name: "장바구니 닫기" }).click();

  await page.goto("/ko/shop/baklava");
  await page.getByRole("button", { name: "수량 늘리기" }).click();
  await page.getByRole("link", { name: "바로 구매" }).click();
  await expect(page).toHaveURL(/\/ko\/checkout\?buy=baklava&qty=2$/);
  await expect(page.getByText("바로 구매 주문입니다.")).toBeVisible();
  const summary = page.getByRole("region", { name: "주문 내역" });
  await expect(summary).toContainText("바클라바 × 2");
  await expect(summary).not.toContainText("티라미수");

  await fillCheckout(page);
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await page.getByRole("button", { name: "결제 승인" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" })).toBeVisible();
  await expect(page.getByRole("button", { name: "장바구니, 1개 담김" })).toBeVisible();
});

test("결제 실패와 취소에도 입력과 장바구니를 유지합니다", async ({ page }) => {
  await page.goto("/ko/shop/baklava");
  await page.getByRole("button", { name: "장바구니에 담기" }).click();
  await page.getByRole("link", { name: "주문하기" }).click();
  await fillCheckout(page);
  const pay = page.getByRole("button", { name: /결제하기$/ });

  await pay.click();
  await page.getByRole("button", { name: "결제 실패" }).click();
  await expect(page.getByText("결제에 실패했습니다.")).toBeVisible();
  await expect(pay).toBeFocused();

  await pay.click();
  await page.getByRole("button", { name: "결제 취소" }).click();
  await expect(page.getByText("결제를 취소했습니다.")).toBeVisible();

  await pay.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "테스트 결제창" })).toBeHidden();

  await expect(page.getByLabel("받는 분 이름")).toHaveValue("홍길동");
  await expect(page.getByRole("button", { name: "장바구니, 1개 담김" })).toBeVisible();
});

test("결제창을 연 채 뒤로 가도 다음 페이지가 스크롤됩니다", async ({ page, isMobile }) => {
  test.skip(isMobile, "부드러운 스크롤 상태는 데스크톱에서 확인합니다");
  await page.goto("/ko/shop/baklava");
  await page.getByRole("link", { name: "바로 구매" }).click();
  await expect(page).toHaveURL(/checkout/);
  await fillCheckout(page);
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await expect(page.getByRole("dialog", { name: "테스트 결제창" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/shop\/baklava$/);
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 800);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
});

test.describe("낮은 화면의 모달", () => {
  test.skip(({ isMobile }) => isMobile, "휠 스크롤은 데스크톱에서 확인합니다");
  test.use({ viewport: { width: 1000, height: 420 } });

  test("장바구니 목록을 휠로 내릴 수 있고 뒤 페이지는 움직이지 않습니다", async ({ page }) => {
    const slugs = ["baklava", "tiramisu", "fraisier", "egg-tart", "freakshake", "vanilla-malt"];
    await page.addInitScript((items) => {
      localStorage.setItem(
        "dessert-land.cart",
        JSON.stringify(items.map((slug) => ({ slug, quantity: 1 }))),
      );
    }, slugs);
    await page.goto("/ko/credits");
    await page.getByRole("button", { name: "장바구니, 6개 담김" }).click();
    const dialog = page.getByRole("dialog", { name: "장바구니" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600);
    const list = dialog.locator("[data-lenis-prevent]");
    await list.hover();
    await page.mouse.wheel(0, 300);
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(50);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("결제창이 화면보다 길어도 끝까지 내려 취소할 수 있습니다", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 300 });
    await page.goto("/ko/checkout?buy=baklava&qty=1");
    await fillCheckout(page);
    await page.getByRole("button", { name: /결제하기$/ }).click();
    const dialog = page.getByRole("dialog", { name: "테스트 결제창" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(300);
    const content = dialog.locator("[data-lenis-prevent]");
    await content.hover();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(50);
    await expect(dialog.getByRole("button", { name: "결제 취소" })).toBeInViewport();
  });
});

test("상품 공유 미리보기에 상품 정보가 나옵니다", async ({ page }) => {
  await page.goto("/en/shop/baklava");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Baklava | Dessert Land");
  await page.goto("/en/shop");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Desserts | Dessert Land");
});

test("승인 요청이 끝나기 전에는 다시 결제할 수 없습니다", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/payments", async (route) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto("/ko/shop/baklava");
  await page.getByRole("link", { name: "바로 구매" }).click();
  await fillCheckout(page);
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await page.getByRole("button", { name: "결제 승인" }).click();
  await expect(page.getByRole("button", { name: "결제 처리 중" })).toBeDisabled();
  await expect(page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" })).toBeVisible();
  expect(calls).toBe(1);
});

test("서버 오류가 나면 안내하고 다시 시도할 수 있습니다", async ({ page }) => {
  await page.route("**/api/payments", (route) => route.abort());
  await page.goto("/ko/shop/baklava");
  await page.getByRole("link", { name: "바로 구매" }).click();
  await fillCheckout(page);
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await page.getByRole("button", { name: "결제 승인" }).click();
  await expect(page.getByText("결제를 처리하지 못했습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: /결제하기$/ })).toBeEnabled();
});

test.describe("Stripe 결제 경로", () => {
  test("키가 없으면 세션을 만들지 않습니다", async ({ request }) => {
    const response = await request.post("/api/checkout-session", {
      data: { items: [{ slug: "baklava", quantity: 1 }], locale: "en", expectedTotal: 15, source: "cart" },
    });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ status: "disabled" });
  });

  test("확인되지 않은 세션은 주문 완료로 보여 주지 않습니다", async ({ page }) => {
    await page.goto("/ko/checkout/complete?session_id=cs_test_forged");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("결제를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    await expect(page.locator("main")).not.toContainText("주문이 완료되었습니다");
  });
});

test.describe("결제 API", () => {
  const body = {
    items: [{ slug: "baklava", quantity: 1 }],
    method: "card",
    locale: "en",
    expectedTotal: 15,
    outcome: "approve",
  };

  test("서버가 계산한 금액으로 승인합니다", async ({ request }) => {
    const response = await request.post("/api/payments", { data: body });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status: "approved", total: 15 });
  });

  test("조작한 금액은 승인하지 않습니다", async ({ request }) => {
    const response = await request.post("/api/payments", { data: { ...body, expectedTotal: 1 } });
    expect(response.status()).toBe(409);
    expect(await response.json()).toEqual({ status: "amount_mismatch", total: 15 });
  });

  test("잘못된 본문은 거절합니다", async ({ request }) => {
    const response = await request.post("/api/payments", {
      headers: { "content-type": "application/json" },
      data: "not json",
    });
    expect(response.status()).toBe(400);
  });
});

test("키보드로 본문 바로가기와 장바구니를 쓸 수 있습니다", async ({ page }) => {
  await page.goto("/ko/shop");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문 바로가기" })).toBeFocused();
  const cartButton = page.getByRole("button", { name: "장바구니", exact: true });
  await cartButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "장바구니" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "장바구니" })).toBeHidden();
  await expect(cartButton).toBeFocused();
});

test.describe("데스크톱 모션", () => {
  test.skip(({ isMobile }) => isMobile, "정밀 포인터 전용 연출입니다");

  test("마우스 위치에 따라 가운데 손이 움직이고 커서가 따라옵니다", async ({ page }) => {
    await page.goto("/ko");
    await page.waitForTimeout(3200);
    const transform = () =>
      page.locator("[data-baker]").evaluate((element) => getComputedStyle(element).transform);
    await page.mouse.move(120, 200, { steps: 6 });
    await page.waitForTimeout(1300);
    const left = await transform();
    await page.mouse.move(1200, 500, { steps: 6 });
    await page.waitForTimeout(1300);
    const right = await transform();
    expect(left).not.toBe(right);
    await expect(page.locator("html")).toHaveAttribute("data-custom-cursor", "on");
  });

  test("키보드로 가려진 카테고리에 들어가면 장면이 펼쳐집니다", async ({ page }) => {
    await page.goto("/ko");
    await page.waitForTimeout(3200);
    const link = page.getByRole("link", { name: "머핀 보기" });
    await link.focus();
    await page.waitForTimeout(1500);
    await expect(link).toBeInViewport();
    const stage = link.locator("xpath=ancestor::*[@data-stage]");
    const clip = await stage.evaluate((element) => getComputedStyle(element).clipPath);
    expect(clip).toMatch(/circle\((1[0-9]{2}|[5-9][0-9])/);
  });

  test("가로 여행 카드에 초점이 오면 화면 안으로 들어옵니다", async ({ page }) => {
    await page.goto("/ko");
    await page.waitForTimeout(3200);
    const link = page.getByRole("link", { name: /파스텔 드 나타/ }).first();
    await link.focus();
    await page.waitForTimeout(1800);
    await expect(link).toBeInViewport();
  });
});
