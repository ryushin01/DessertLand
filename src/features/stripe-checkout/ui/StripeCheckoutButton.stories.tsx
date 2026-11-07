import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StripeCheckoutButton } from "./StripeCheckoutButton";

const meta: Meta<typeof StripeCheckoutButton> = {
  title: "features/StripeCheckoutButton",
  component: StripeCheckoutButton,
  args: {
    items: [{ slug: "baklava", quantity: 1 }],
    total: 13300,
    source: "cart",
    canceled: false,
  },
};
export default meta;

type Story = StoryObj<typeof StripeCheckoutButton>;
export const Default: Story = {};
export const Canceled: Story = { args: { canceled: true } };
