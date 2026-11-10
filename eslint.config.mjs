import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: ["styled-system/**", ".next/**", "storybook-static/**", "public/storybook/**", "playwright-report/**"] },
  ...next,
  ...nextTs,
];

export default config;
