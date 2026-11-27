import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HttpResponse, delay, http } from "msw";

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
  // Storybook에서는 Stripe 결제 화면(외부)으로 가지 않도록, 세션 요청의 응답을 MSW로 정합니다.
  parameters: {
    msw: {
      handlers: [
        http.post("/api/checkout-session", () =>
          HttpResponse.json({ status: "amount_mismatch" }, { status: 409 }),
        ),
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof StripeCheckoutButton>;
export const Default: Story = {};
export const Canceled: Story = { args: { canceled: true } };
/** 세션을 만드는 동안(응답 지연) 버튼이 잠깁니다. */
export const Pending: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post("/api/checkout-session", async () => {
          await delay("infinite");
          return new HttpResponse(null);
        }),
      ],
    },
  },
};
