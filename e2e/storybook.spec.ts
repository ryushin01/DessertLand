import { existsSync, readFileSync } from "node:fs";

// Storybook 미리보기에는 쇼핑몰 머리글이 없어, 하이드레이션을 기다리는 공용 fixtures 대신 기본 test를 씁니다.
import { expect, test } from "@playwright/test";

/**
 * 운영에 함께 배포하는 Storybook(public/storybook)의 모든 이야기가 오류 화면 없이 그려지는지 봅니다(데스크톱만).
 * 이야기가 앱 맥락(라우터 등)을 빠뜨리면 Storybook은 빨간 오류 화면(sb-show-errordisplay)을 띄웁니다.
 */
const INDEX = "public/storybook/index.json";
const ids: string[] = existsSync(INDEX)
  ? Object.values(
      (
        JSON.parse(readFileSync(INDEX, "utf8")) as {
          entries: Record<string, { id: string; type: string }>;
        }
      ).entries,
    )
      .filter((entry) => entry.type === "story")
      .map((entry) => entry.id)
  : [];

test("Storybook을 빌드했습니다", () => {
  expect(ids.length).toBeGreaterThan(0);
});

for (const id of ids) {
  test(`${id}: 오류 없이 그려집니다`, async ({ page, isMobile }) => {
    test.skip(isMobile, "이야기는 데스크톱에서 한 번만 봅니다");
    await page.goto(`/storybook/iframe.html?id=${id}&viewMode=story`);
    // 이야기가 그려지거나(뿌리에 내용이 생김) 오류 화면이 뜰 때까지 기다린 뒤 판단합니다.
    const state = () =>
      page.evaluate(() =>
        document.body.classList.contains("sb-show-errordisplay")
          ? (document.querySelector("#error-message")?.textContent ?? "오류")
          : (document.querySelector("#storybook-root")?.childElementCount ?? 0) > 0
            ? "ok"
            : "",
      );
    await expect.poll(state).not.toBe("");
    await page.waitForLoadState("networkidle");
    expect(await state()).toBe("ok");
  });
}
