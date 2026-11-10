import type { StorybookConfig } from "@storybook/nextjs-vite";

/** 앱과 함께 배포하는 빌드(pnpm build-storybook, pnpm build)인지. 환경 변수 대신 스크립트 이름으로 판단해 Windows에서도 동작합니다. */
const inApp = process.env.npm_lifecycle_event === "build-storybook";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/nextjs-vite",
  // 앱과 함께 배포할 때(pnpm build-storybook)는 public을 복사하지 않습니다. 같은 주소의 /images를 그대로 씁니다.
  staticDirs: inApp ? [] : ["../public"],
  viteFinal: (viteConfig) => (inApp ? { ...viteConfig, publicDir: false } : viteConfig),
};

export default config;
