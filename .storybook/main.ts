import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/nextjs-vite",
  // 앱과 함께 배포할 때(STORYBOOK_IN_APP=1)는 public을 복사하지 않습니다. 같은 주소의 /images를 그대로 씁니다.
  staticDirs: process.env.STORYBOOK_IN_APP ? [] : ["../public"],
  viteFinal: (viteConfig) =>
    process.env.STORYBOOK_IN_APP ? { ...viteConfig, publicDir: false } : viteConfig,
};

export default config;
