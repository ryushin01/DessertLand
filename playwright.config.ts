import { defineConfig, devices } from "@playwright/test";

// 다른 작업이 기본 포트를 쓰고 있으면 E2E_PORT로 바꿉니다.
const PORT = Number(process.env.E2E_PORT ?? 4391);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/ko`,
    reuseExistingServer: false,
  },
});
