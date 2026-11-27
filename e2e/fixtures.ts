import { test as base, type Page } from "@playwright/test";

export { expect } from "@playwright/test";
export type { APIRequestContext, BrowserContext, Page } from "@playwright/test";

/** 머리글(클라이언트 컴포넌트)에 React가 붙었는지 봅니다. 하이드레이션이 끝나면 DOM 노드에 __reactFiber 키가 생깁니다. */
const isHydrated = () => {
  const header = document.querySelector("header");
  return header !== null && Object.keys(header).some((key) => key.startsWith("__reactFiber"));
};

/**
 * 하이드레이션 전에 버튼을 누르면 React 이벤트가 아직 붙지 않아 클릭이 사라집니다.
 * CPU가 느린 CI의 모바일 에뮬레이션에서 간헐적으로 실패하던 원인이라, page.goto 뒤에는 머리글이 하이드레이션될 때까지 기다립니다.
 * 머리글이 없는 화면(외부 사이트 등)은 기다리다 넘어갑니다.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, provide) => {
    const goto = page.goto.bind(page);
    page.goto = (async (url: string, options?: Parameters<Page["goto"]>[1]) => {
      const response = await goto(url, options);
      await page.waitForFunction(isHydrated, undefined, { timeout: 15_000 }).catch(() => undefined);
      return response;
    }) as Page["goto"];
    await provide(page);
  },
});
