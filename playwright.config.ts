import { defineConfig, devices } from "@playwright/test";

import { MOCK_ADMIN_PASSWORD } from "./e2e/mock-env";

// 다른 작업이 기본 포트를 쓰고 있으면 E2E_PORT로 바꿉니다.
const PORT = Number(process.env.E2E_PORT ?? 4391);
// MSW 목업 서버(Stripe·Claude 키가 있는 흐름). 기본은 PORT + 1이고 E2E_MOCK_PORT로 바꿉니다.
const MOCK_PORT = Number(process.env.E2E_MOCK_PORT ?? PORT + 1);
// Stripe·Claude 장애 서버(키는 있지만 바깥 요청이 모두 끊긴 배포본). 기본은 PORT + 2이고 E2E_OUTAGE_PORT로 바꿉니다.
const OUTAGE_PORT = Number(process.env.E2E_OUTAGE_PORT ?? PORT + 2);

// 따로 띄운 서버(목업·장애)에서만 도는 테스트. 기본 서버(데스크톱·모바일)에서는 돌리지 않습니다.
const SERVER_SPECS = /(mocked|outage)\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: SERVER_SPECS },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: SERVER_SPECS },
    {
      name: "mocked",
      testMatch: /mocked\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${MOCK_PORT}` },
    },
    {
      name: "outage",
      testMatch: /outage\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${OUTAGE_PORT}` },
    },
  ],
  webServer: [
    {
      command: `pnpm exec next start -p ${PORT}`,
      url: `http://localhost:${PORT}/ko`,
      reuseExistingServer: false,
    },
    {
      // 같은 빌드를 MSW 목업(src/instrumentation.ts)과 함께 띄웁니다. Stripe·Claude는 키가 있는 것처럼 동작하고
      // 바깥 요청은 MSW가 받아 실제 결제·유료 API 호출이 없습니다.
      command: `pnpm exec next start -p ${MOCK_PORT}`,
      url: `http://localhost:${MOCK_PORT}/ko`,
      reuseExistingServer: false,
      // 실제 키·비밀번호가 아닌 목업 값입니다. 서버는 이 값으로 바깥에 닿지 않습니다(MSW가 가로챔).
      env: {
        E2E_MSW: "1",
        STRIPE_SECRET_KEY: "sk_test_msw_mock",
        ANTHROPIC_API_KEY: "msw-mock-key",
        ADMIN_PASSWORD: MOCK_ADMIN_PASSWORD,
      },
    },
    {
      // 같은 빌드를 키가 있는 배포본처럼 띄우되, 서버가 Stripe·Claude로 보내는 요청은 MSW가 모두 네트워크 오류로 끊습니다.
      command: `pnpm exec next start -p ${OUTAGE_PORT}`,
      url: `http://localhost:${OUTAGE_PORT}/ko`,
      reuseExistingServer: false,
      env: {
        E2E_MSW: "outage",
        STRIPE_SECRET_KEY: "sk_test_msw_outage",
        ANTHROPIC_API_KEY: "msw-outage-key",
        ADMIN_PASSWORD: MOCK_ADMIN_PASSWORD,
      },
    },
  ],
});
