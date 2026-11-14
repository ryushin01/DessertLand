import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CheckoutForm } from "./CheckoutForm";

const meta: Meta<typeof CheckoutForm> = {
  title: "pages/Checkout/CheckoutForm",
  component: CheckoutForm,
  args: { items: [{ slug: "baklava", quantity: 1 }], total: 13300, onPaid: () => {} },
};
export default meta;

export const Default: StoryObj<typeof CheckoutForm> = {};
