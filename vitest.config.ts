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
  },
});
