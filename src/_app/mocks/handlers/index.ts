// MSW 목업 한곳 모음. 쓰는 곳: Vitest(node.ts), Storybook(.storybook/preview.tsx), 어드민 공개 데모·오프라인(browser.ts),
// E2E 목업 서버(src/instrumentation.ts, E2E_MSW=1)와 장애 서버(E2E_MSW=outage).
import { adminDemoHandlers, adminSessionHandlers } from "./admin";
import { adminTextHandlers } from "./admin-texts";
import { appHandlers } from "./app";
import { claudeHandlers } from "./claude";
import { outageHandlers } from "./outage";
import { sentryHandlers } from "./sentry";
import { stripeHandlers } from "./stripe";

/** 서버가 부르는 바깥 서비스(Stripe·Claude·Sentry) */
export const externalHandlers = [...stripeHandlers, ...claudeHandlers, ...sentryHandlers];

/** Stripe·Claude가 끊긴 배포본(E2E 장애 서버, E2E_MSW=outage). Sentry는 그대로 받습니다. */
export const outageExternalHandlers = [...outageHandlers, ...sentryHandlers];

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
export { outageHandlers } from "./outage";
export { sentryHandlers } from "./sentry";
export { resetStripeSessions, seedStripeSession, stripeHandlers } from "./stripe";
