import { setupServer } from "msw/node";

import { browserHandlers, externalHandlers } from "./handlers";

/**
 * Node용 목업 서버. Vitest(모든 테스트, vitest.setup.ts)와 E2E 목업 서버(src/instrumentation.ts)가 씁니다.
 * 목업이 없는 요청은 그대로 보냅니다(bypass).
 */
export const server = setupServer(...externalHandlers, ...browserHandlers);
