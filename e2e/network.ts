import AxeBuilder from "@axe-core/playwright";

import { expect, type BrowserContext, type Page } from "./fixtures";

/** localhost 안(같은 출처, data·blob)인지 봅니다. */
const isLocal = (url: string) => {
  const { protocol, hostname } = new URL(url);
  return (
    protocol === "data:" ||
    protocol === "blob:" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
};

/**
 * 브라우저에서 localhost 밖으로 나가는 요청을 모두 끊습니다(인터넷이 끊긴 것과 같은 오류).
 * 돌려준 목록에 끊긴 주소가 쌓입니다. 화면은 그래도 떠야 하지만, 애초에 밖으로 나가려 한 곳이 없어야 합니다.
 */
export async function blockExternal(context: BrowserContext): Promise<string[]> {
  const blocked: string[] = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (isLocal(url)) return route.continue();
    blocked.push(url);
    return route.abort("internetdisconnected");
  });
  return blocked;
}

/** WCAG 2.2 AA까지 axe 검사. 위반이 있으면 규칙과 첫 대상을 보여 줍니다. */
export async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.target}`)).toEqual([]);
}
