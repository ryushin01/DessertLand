import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

/**
 * 오프라인 검증: localhost 밖으로 나가는 요청을 모두 막고(.env 없이 빌드한 앱에서) 주요 화면이 내용과 함께 뜨는지 봅니다.
 * 포트폴리오 데모라 외부 서비스(글꼴 서버, Stripe, Claude API, 분석)가 끊겨도 화면이 비면 안 됩니다.
 */
const isLocal = (url: string) => {
  const { protocol, hostname } = new URL(url);
  return (
    protocol === "data:" ||
    protocol === "blob:" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
};

let blocked: string[] = [];

test.beforeEach(async ({ context }) => {
  blocked = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (isLocal(url)) return route.continue();
    blocked.push(url);
    return route.abort("internetdisconnected");
  });
});

test.afterEach(() => {
  // 막힌 요청이 있어도 화면은 떠야 하지만, 애초에 외부로 나가려 한 곳이 없어야 합니다.
  expect(blocked).toEqual([]);
});

async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.target}`)).toEqual([]);
}

/** 화면에 보이는 사진(앞쪽 몇 장)이 같은 출처에서 실제로 그려졌는지 봅니다. */
async function expectImagesLoaded(page: Page) {
  const images = page.locator("main img:visible");
  await expect(images.first()).toBeVisible();
  const count = Math.min(await images.count(), 4);
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
}

test.describe("오프라인", () => {
  test("홈: 소개·분류·추천이 보이고 글꼴도 같은 출처에서 받습니다", async ({ page }) => {
    await page.goto("/ko");
    await expect(page.getByRole("heading", { level: 1, name: "Dessert Land" })).toBeVisible();
    await expect(page.locator("#advisor")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.fonts.check('16px "Grandiflora One"', "디저트")),
    ).toBe(true);
    await scan(page);
  });

  test("상품 목록과 상세가 사진·가격과 함께 보입니다", async ({ page }) => {
    await page.goto("/ko/shop");
    await expect(page.getByRole("link", { name: /바클라바/ }).first()).toBeVisible();
    await expectImagesLoaded(page);
    await scan(page);

    await page.goto("/ko/shop/baklava");
    await expect(page.getByRole("heading", { level: 1, name: "바클라바" })).toBeVisible();
    await expect(page.locator("main")).toContainText("₩");
    await expectImagesLoaded(page);
    await scan(page);
  });

  test("API 키 없이도 기본 추천을 보여 줍니다", async ({ page }) => {
    await page.goto("/ko#advisor");
    const advisor = page.locator("#advisor");
    await advisor.getByLabel("원하는 디저트 설명").fill("상큼한 것");
    await advisor.getByRole("button", { name: "추천받기" }).click();
    const results = page.getByTestId("advisor-results");
    await expect(results).toContainText("기본 추천 (AI 미사용)");
    await expect(results.getByRole("listitem").first()).toBeVisible();
    await scan(page);
  });

  test("결제는 내장 테스트 결제로 끝까지 진행되고 주문 내역에 남습니다", async ({ page }) => {
    await page.goto("/ko/checkout?buy=baklava&qty=1");
    await expect(page.locator("main")).toContainText("데모 사이트입니다");
    await page.getByLabel("받는 분 이름").fill("홍길동");
    await page.getByLabel("이메일").fill("demo@example.com");
    await page.getByLabel("배송 주소").fill("서울시 가상구 예시로 1");
    await page.getByRole("button", { name: /결제하기$/ }).click();
    const paymentDialog = page.getByRole("dialog", { name: "테스트 결제창" });
    await expect(paymentDialog).toBeVisible();
    await scan(page);
    await paymentDialog.getByRole("button", { name: "결제 승인" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" }),
    ).toBeVisible();

    await page.goto("/ko/orders");
    await expect(page.locator("main")).toContainText("테스트 결제");
    await scan(page);
  });

  for (const [locale, family] of [
    ["ja", "Kaisei Decol"],
    ["zh", "Noto Serif SC"],
    ["tr", null],
  ] as const) {
    test(`${locale} 화면도 외부 글꼴 서버 없이 뜹니다`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.getByRole("heading", { level: 1, name: "Dessert Land" })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (family) {
        const loaded = await page.evaluate(
          (name) =>
            [...document.fonts].some(
              (face) => face.family.replaceAll('"', "") === name && face.status === "loaded",
            ),
          family,
        );
        expect(loaded).toBe(true);
      }
      await scan(page);
    });
  }

  test("어드민도 인터넷 없이 데모로 들어가 내용과 글꼴이 같은 출처에서 뜹니다", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: "관리자로 둘러보기" }).click();
    // 들어간 뒤 이동은 서버 응답을 기다리므로 주소가 바뀔 때까지 봅니다(부하가 큰 CI 대비, admin.spec.ts와 같음).
    await page.waitForURL((url) => url.pathname === "/admin");
    await expect(page.getByRole("main")).toContainText("인기 상품");
    await page.evaluate(() => document.fonts.ready);
    await page.goto("/admin/products/tiramisu");
    await expect(page.getByLabel("이름(영어)")).toHaveValue("Tiramisu");
    await page.goto("/admin/orders");
    await expect(page.getByRole("main")).toContainText("결제 완료");
    await page.waitForTimeout(1500);
    await scan(page);
  });

  test("Storybook도 오프라인에서 열립니다", async ({ page }) => {
    await page.goto("/storybook/index.html");
    // 모바일 배치에서는 탐색 트리가 서랍에 숨으므로, 미리보기 칸에 첫 화면이 그려졌는지로 봅니다.
    const preview = page.frameLocator("#storybook-preview-iframe");
    await expect(preview.locator("#storybook-root > *, #storybook-docs > *").first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
