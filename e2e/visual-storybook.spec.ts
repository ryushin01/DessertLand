import { existsSync, readFileSync } from "node:fs";

// Storybook 미리보기에는 쇼핑몰 머리글이 없어, 하이드레이션을 기다리는 공용 fixtures 대신 기본 test를 씁니다.
import { expect, test } from "@playwright/test";

/**
 * Storybook 시각 회귀: 빌드한 Storybook(public/storybook)의 모든 이야기를 기준 이미지와 비교합니다(데스크톱만).
 * 기준 이미지와 움직임 멈추기는 visual.spec.ts와 같습니다.
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

test.use({ reducedMotion: "reduce", timezoneId: "Asia/Seoul" });

test("Storybook을 빌드했습니다", () => {
  expect(ids.length).toBeGreaterThan(0);
});

for (const id of ids) {
  test(id, async ({ page, isMobile }) => {
    test.skip(isMobile, "이야기는 데스크톱 한 번만 비교합니다");
    await page.clock.setFixedTime(new Date("2026-11-27T12:00:00+09:00"));
    await page.goto(`/storybook/iframe.html?id=${id}&viewMode=story`);
    // 대화상자·펼친 메뉴 이야기는 뿌리 밖(최상위 층)에 그리므로, 뿌리가 생기고 요청이 끝나기를 기다립니다.
    await expect(page.locator("#storybook-root")).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${id}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    });
  });
}
