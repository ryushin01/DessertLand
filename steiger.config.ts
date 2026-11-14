import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

/** FSD 구조 검사 (pnpm lint:fsd) */
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Next.js의 app·pages 폴더와 겹치지 않도록 계층 이름을 _app, _pages로 씁니다.
    rules: { "fsd/typo-in-layer-name": "off" },
  },
  {
    // API 라우트(src/app/api)가 index.server로 쓰는 슬라이스입니다. Steiger는 src/app을 검사하지 않고
    // index.server 참조도 세지 않아 "참조 없음"으로 잘못 봅니다(stripe-checkout은 결제 화면도 씀).
    files: [
      "./src/features/pay-order/**",
      "./src/features/recommend-dessert/**",
      "./src/features/stripe-checkout/**",
    ],
    rules: { "fsd/insignificant-slice": "off" },
  },
  {
    // Next.js 라우트 폴더(src/app)는 FSD 계층이 아니라 _pages·_app을 다시 내보내기만 합니다.
    // 테스트·스토리는 흉내 내려고 내부 모듈을 직접 가져오기도 해서 검사에서 뺍니다.
    ignores: ["./src/app/**", "**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"],
  },
]);
