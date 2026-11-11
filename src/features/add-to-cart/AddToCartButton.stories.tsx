import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AddToCartButton } from "./AddToCartButton";

const meta: Meta<typeof AddToCartButton> = {
  title: "features/AddToCartButton",
  component: AddToCartButton,
  args: { slug: "baklava", children: "장바구니에 담기" },
};
export default meta;

type Story = StoryObj<typeof AddToCartButton>;
export const Default: Story = {};
export const SmallOutline: Story = {
  args: {
    size: "sm",
    tone: "outline",
    children: "담기",
    accessibleName: "바클라바 장바구니에 담기",
  },
};
