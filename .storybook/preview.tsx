import "../src/_app/styles/global.css";

import type { Preview } from "@storybook/nextjs-vite";
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { NextIntlClientProvider } from "next-intl";

import { browserHandlers } from "../src/_app/mocks/handlers";
import messages from "../src/shared/i18n/messages/ko.json";

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
  // 스토리의 네트워크는 MSW(src/_app/mocks)가 받습니다. 워커 파일은 .storybook/public/mockServiceWorker.js이고,
  // 앱과 함께 배포하면 /storybook/ 범위에서만 동작합니다(같은 출처, 쇼핑몰 화면에는 붙지 않음).
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker(...browserHandlers);
      await worker.start({
        serviceWorker: { url: "./mockServiceWorker.js" },
        onUnhandledFrame: "bypass",
        quiet: true,
      });
      return worker;
    }),
  ],
  parameters: { a11y: { test: "error" } },
};

export default preview;
