import { gzipSync } from "node:zlib";

import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * 첫 화면 HTML이 요구하는 JS의 압축 크기(KB) 상한입니다.
 * 넘으면 먼저 `pnpm analyze`로 원인을 확인하고, 올려야 한다면 docs/development.md의 기준 수치도 고칩니다.
 * 링크 프리페치로 나중에 받는 코드는 첫 화면을 막지 않으므로 세지 않습니다.
 */
const JS_BUDGET_KB: Record<string, number> = {
  "/ko": 240,
  "/ko/shop": 235,
  "/ko/shop/baklava": 235,
  "/ko/checkout": 190,
};
const CSS_BUDGET_KB = 25;

type Asset = { size: number; body: string };

async function loadAssets(
  request: APIRequestContext,
  html: string,
  pattern: RegExp,
): Promise<Asset[]> {
  const urls = new Set<string>();
  for (const [tag, url] of html.matchAll(pattern)) {
    // nomodule 스크립트는 구형 브라우저용 폴리필이라 지금 브라우저는 받지 않습니다.
    if (url && !/\bnomodule\b/i.test(tag)) urls.add(url.replaceAll("&amp;", "&"));
  }
  return Promise.all(
    Array.from(urls, async (url) => {
      const response = await request.get(url);
      expect(response.ok(), `${url} 응답 ${response.status()}`).toBe(true);
      const body = await response.body();
      return { size: gzipSync(body).length, body: body.toString("utf8") };
    }),
  );
}

async function loadHtml(request: APIRequestContext, path: string): Promise<string> {
  const response = await request.get(path);
  expect(response.ok(), `${path} 응답 ${response.status()}`).toBe(true);
  return response.text();
}

const toKb = (assets: Asset[]) =>
  Math.round(assets.reduce((sum, asset) => sum + asset.size, 0) / 1024);

for (const [path, budget] of Object.entries(JS_BUDGET_KB)) {
  test(`${path} 첫 화면이 전송량 예산을 지킵니다`, async ({ request }) => {
    const html = await loadHtml(request, path);
    const scripts = await loadAssets(request, html, /<script[^>]*\bsrc="([^"]+\.js[^"]*)"[^>]*>/g);
    const styles = await loadAssets(
      request,
      html,
      /<link[^>]*rel="stylesheet"[^>]*href="(\/_next[^"]+)"[^>]*>/g,
    );
    test.info().annotations.push({
      type: "size",
      description: `js ${toKb(scripts)}KB, css ${toKb(styles)}KB`,
    });
    // 찾은 파일이 없으면 0KB로 통과해 버리므로, 측정이 실제로 됐는지 먼저 확인합니다.
    expect(scripts.length).toBeGreaterThan(0);
    expect(styles.length).toBeGreaterThan(0);
    expect(toKb(scripts)).toBeLessThanOrEqual(budget);
    expect(toKb(styles)).toBeLessThanOrEqual(CSS_BUDGET_KB);
  });
}

test("모션이 없는 페이지의 첫 화면에는 GSAP이 없습니다", async ({ request }) => {
  for (const path of ["/ko/checkout"]) {
    const html = await loadHtml(request, path);
    const scripts = await loadAssets(request, html, /<script[^>]*\bsrc="([^"]+\.js[^"]*)"[^>]*>/g);
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.some(({ body }) => body.includes("GreenSock"))).toBe(false);
  }
});

test("움직임 코드는 필요한 기기에서만 동작합니다", async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/ko");
  await page.waitForTimeout(3000);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
  if (isMobile) {
    await expect(page.locator("[data-baker] canvas")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
  } else {
    // WebGL을 못 쓰는 환경에서는 컷아웃 이미지가 대신 보이는 것이 정상입니다.
    const hasWebgl = await page.evaluate(
      () => document.createElement("canvas").getContext("webgl") !== null,
    );
    if (hasWebgl) await expect(page.locator("[data-baker] canvas")).toHaveCount(1);
    else await expect(page.locator("[data-baker] img")).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/lenis/);
    await expect(page.locator("html")).toHaveAttribute("data-custom-cursor", "on");
  }
  expect(errors).toEqual([]);
});
