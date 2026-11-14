import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next가 등록한 jsx-a11y 플러그인을 그대로 씁니다. 플러그인을 다시 등록하면 중복 오류가 납니다.
const jsxA11y = next.find((config) => config.plugins?.["jsx-a11y"])?.plugins?.["jsx-a11y"];

const config = [
  { ignores: ["styled-system/**", ".next/**", "storybook-static/**", "public/storybook/**", "playwright-report/**"] },
  ...next,
  ...nextTs,
  {
    // eslint-config-next는 jsx-a11y 규칙을 몇 개만 켭니다. recommended 규칙을 모두 켭니다.
    files: ["**/*.{jsx,tsx}"],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // 가로로 스크롤되는 영역은 키보드로 스크롤할 수 있게 이름을 가진 region에 tabIndex={0}을 줍니다.
      "jsx-a11y/no-noninteractive-tabindex": ["error", { tags: [], roles: ["tabpanel", "region"] }],
    },
  },
];

export default config;
