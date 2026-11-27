export { onRequestError } from "@/_app/monitoring/index.server";

/**
 * 서버가 뜰 때 한 번 불립니다. E2E 목업 서버(playwright.config.ts, E2E_MSW=1)와 장애 서버(E2E_MSW=outage)에서만
 * MSW로 Stripe·Claude·Sentry를 흉내 내거나 끊습니다. 운영·일반 실행에서는 아무것도 하지 않습니다.
 */
export async function register() {
  const mode = process.env.E2E_MSW;
  if ((mode !== "1" && mode !== "outage") || process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startExternalMocks } = await import("@/_app/mocks/external");
  startExternalMocks(mode === "outage" ? "outage" : "mock");
}
