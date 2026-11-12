import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LocaleSwitcher } from "./LocaleSwitcher";

const meta: Meta<typeof LocaleSwitcher> = {
  title: "features/LocaleSwitcher",
  component: LocaleSwitcher,
  decorators: [
    (Story) => (
      <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 520, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

/** 언어 메뉴를 펼쳐 국기와 언어 이름을 보여 줍니다. */
export const Open: StoryObj<typeof LocaleSwitcher> = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("details")?.setAttribute("open", "");
  },
};
