import { expect, test } from "./fixtures";
import { scan } from "./network";

/**
 * 화면 안의 상태별 접근성(axe). 라우트별 검사는 offline.spec.ts, 장바구니 서랍·결제창·추천 결과는 offline.spec.ts와
 * shop.spec.ts, 어드민 대화상자는 admin.spec.ts가 봅니다. 여기서는 그 밖의 상태(입력 오류, 결제 실패, 메뉴, 결과 없음)를 봅니다.
 */
test("결제 입력 오류: 빈 칸을 알리고 첫 오류 칸으로 초점을 옮깁니다", async ({ page }) => {
  await page.goto("/ko/checkout?buy=baklava&qty=1");
  await page.getByRole("button", { name: /결제하기$/ }).click();
  const name = page.getByLabel("받는 분 이름");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  await scan(page);
});

test("내장 테스트 결제 실패: 실패를 알리고 다시 시도할 수 있습니다", async ({ page }) => {
  await page.goto("/ko/checkout?buy=baklava&qty=1");
  await page.getByLabel("받는 분 이름").fill("홍길동");
  await page.getByLabel("이메일").fill("demo@example.com");
  await page.getByLabel("배송 주소").fill("서울시 가상구 예시로 1");
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await page
    .getByRole("dialog", { name: "테스트 결제창" })
    .getByRole("button", { name: "결제 실패" })
    .click();
  await expect(page.getByRole("alert").filter({ hasText: "결제에 실패했습니다" })).toBeVisible();
  await scan(page);
});

test("언어 메뉴를 펼친 상태", async ({ page }) => {
  await page.goto("/ko");
  await page.getByLabel("언어 선택: 한국어").click();
  await expect(page.getByRole("link", { name: "United States, English" })).toBeVisible();
  await scan(page);
});

test("찾는 디저트가 없을 때", async ({ page }) => {
  await page.goto("/ko/shop");
  await page.getByRole("searchbox", { name: "이름이나 나라로 찾기" }).fill("없는디저트이름");
  await expect(page.getByText("조건에 맞는 디저트가 없습니다")).toBeVisible();
  await scan(page);
});
