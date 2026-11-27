import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "styled-system": fileURLToPath(new URL("./styled-system", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    css: false,
    // 데모 모드는 값이 없으면 켜지므로(src/shared/config/demo.ts), 단위 테스트는 원래 동작(데모 꺼짐)을 기준으로 봅니다.
    // 데모에서의 동작은 각 테스트가 인자로 켜서 확인합니다.
    env: { NEXT_PUBLIC_DEMO: "0" },
    // pnpm test:coverage(pnpm check·CI)에서만 켭니다. 표는 coverage/coverage-summary.json → scripts/coverage-summary.mjs.
    coverage: {
      provider: "v8",
      reportOnFailure: true,
      reporter: ["text-summary", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.{test,stories}.{ts,tsx}",
        // 목업(테스트 도구)과 라우트 다시 내보내기
        "src/_app/mocks/**",
        "src/app/**",
        // WebGL·GSAP·Lenis 화면 효과: jsdom에서 그릴 수 없어 E2E(performance-budget.spec.ts)와 시각 회귀가 봅니다.
        "src/_pages/home/lib/baker-renderer.ts",
        "src/shared/lib/gsap/**",
        "src/shared/lib/motion/lenis.ts",
      ],
      thresholds: {
        // 전체: 지금 값 아래로 내려가지 않게 기준선을 겁니다(올릴 수는 있어도 내리지 않음).
        lines: 52,
        statements: 52,
        functions: 50,
        branches: 54,
        // 로직 계층(FSD의 lib·model·api 세그먼트): 80%
        "src/**/{lib,model,api}/**": { lines: 80, statements: 80, functions: 80, branches: 80 },
      },
    },
  },
});
