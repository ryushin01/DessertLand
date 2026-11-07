import "../src/_app/styles/global.css";

import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import messages from "../src/shared/i18n/messages/ko.json";

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
  parameters: { a11y: { test: "error" } },
};

export default preview;
