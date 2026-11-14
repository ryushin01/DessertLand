import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BuyNowLink } from "./BuyNowLink";

const meta: Meta<typeof BuyNowLink> = {
  title: "features/BuyNowLink",
  component: BuyNowLink,
  args: { slug: "baklava", quantity: 2, children: "바로 구매" },
};
export default meta;

export const Default: StoryObj<typeof BuyNowLink> = {};
