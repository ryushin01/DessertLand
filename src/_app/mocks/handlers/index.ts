// MSW 목업 한곳 모음. 쓰는 곳: Vitest(node.ts), Storybook(.storybook/preview.tsx), 어드민 공개 데모·오프라인(browser.ts),
// E2E 목업 서버(src/instrumentation.ts, E2E_MSW=1).
import { adminDemoHandlers, adminSessionHandlers } from "./admin";
import { adminTextHandlers } from "./admin-texts";
import { appHandlers } from "./app";
import { claudeHandlers } from "./claude";
import { sentryHandlers } from "./sentry";
import { stripeHandlers } from "./stripe";

/** 서버가 부르는 바깥 서비스(Stripe·Claude·Sentry) */
export const externalHandlers = [...stripeHandlers, ...claudeHandlers, ...sentryHandlers];

/** 브라우저가 부르는 이 앱의 API(테스트·Storybook) */
export const browserHandlers = [
  ...appHandlers,
  ...adminDemoHandlers,
  ...adminSessionHandlers,
  ...adminTextHandlers,
];

export { adminDemoHandlers, adminSessionHandlers } from "./admin";
export { adminTextHandlers } from "./admin-texts";
export { RECOMMEND_EVENTS, appHandlers, recommendChunks } from "./app";
export { claudeHandlers, claudeSseChunks } from "./claude";
export { sentryHandlers } from "./sentry";
export { resetStripeSessions, seedStripeSession, stripeHandlers } from "./stripe";
