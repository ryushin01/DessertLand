import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "shared/Button",
  component: Button,
  args: { children: "장바구니에 담기" },
};
export default meta;

type Story = StoryObj<typeof Button>;
export const Solid: Story = {};
export const Outline: Story = { args: { tone: "outline" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };
