import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RevealText } from "./RevealText";

const meta: Meta<typeof RevealText> = {
  title: "shared/RevealText",
  component: RevealText,
  args: { as: "h1", text: "세계의 디저트", immediate: true },
};
export default meta;

export const Default: StoryObj<typeof RevealText> = {};
