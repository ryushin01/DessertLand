import { expect, test, type Page } from "./fixtures";

/**
 * 시각 회귀: 쇼핑몰·어드민 주요 화면(데스크톱·모바일)과 Storybook 이야기를 기준 이미지와 비교합니다.
 * - 기준 이미지는 Linux CI 결과물입니다(e2e/__screenshots__). 글자 그리기가 운영체제마다 달라, 다른 운영체제에서는
 *   비교를 건너뜁니다(playwright.config.ts의 ignoreSnapshots). 화면을 바꿨으면 CI가 올린 결과물로 기준 이미지를 바꿉니다
 *   (docs/development.md "시각 회귀").
 * - 움직임은 멈춥니다: 움직임 줄이기(reduced motion)로 GSAP 글자 등장·Lenis·커서 효과를 끄고, CSS 애니메이션도 멈추며,
 *   WebGL 캔버스는 가립니다. 날짜가 화면에 나오므로 시계를 고정합니다.
 */
const FIXED_TIME = new Date("2026-11-27T12:00:00+09:00");

test.use({ reducedMotion: "reduce", timezoneId: "Asia/Seoul" });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(FIXED_TIME);
});

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  // 보이는 사진이 모두 그려질 때까지 기다립니다.
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.images]
          .filter((image) => {
            // 화면 안에 실제로 보이는 사진만 봅니다(숨김·가로로 밀려난 것·지연 로딩으로 아직 안 받은 것 제외).
            const rect = image.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth
            );
          })
          .every((image) => image.complete && image.naturalWidth > 0),
      ),
    )
    .toBe(true);
}

async function expectScreen(page: Page, name: string) {
  await settle(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: "disabled",
    caret: "hide",
    mask: [page.locator("canvas")],
    maxDiffPixelRatio: 0.01,
  });
}

test.describe("쇼핑몰", () => {
  for (const [name, path] of [
    ["home", "/ko"],
    ["home-en", "/en"],
    ["shop", "/ko/shop"],
    ["product", "/ko/shop/baklava"],
    ["checkout", "/ko/checkout?buy=baklava&qty=1"],
    ["orders", "/ko/orders"],
  ] as const) {
    test(name, async ({ page }) => {
      await page.goto(path);
      await expectScreen(page, `shop-${name}`);
    });
  }
});

test.describe("어드민", () => {
  test("들어가기", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1500);
    await expectScreen(page, "admin-login");
  });

  for (const [name, path] of [
    ["dashboard", "/admin"],
    ["products", "/admin/products"],
    ["product", "/admin/products/tiramisu"],
    ["orders", "/admin/orders"],
  ] as const) {
    test(name, async ({ page }) => {
      await page.goto(path);
      await page.getByRole("button", { name: "관리자로 둘러보기" }).click();
      await page.waitForURL((url) => url.pathname === path);
      // 화면 전환 덮개(사선)가 걷힌 뒤에 찍습니다.
      await page.waitForTimeout(1500);
      await expectScreen(page, `admin-${name}`);
    });
  }
});
