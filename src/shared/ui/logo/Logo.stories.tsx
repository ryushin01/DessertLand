import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "./Logo";

const meta: Meta<typeof Logo> = { title: "shared/Logo", component: Logo };
export default meta;

export const Default: StoryObj<typeof Logo> = {
  render: (args) => (
    <div style={{ background: "#00020e", display: "inline-flex", padding: 24 }}>
      <Logo {...args} />
    </div>
  ),
};
export const Large: StoryObj<typeof Logo> = { ...Default, args: { size: 120 } };
