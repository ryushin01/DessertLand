import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DessertAdvisor } from "./DessertAdvisor";

const meta: Meta<typeof DessertAdvisor> = {
  title: "widgets/DessertAdvisor",
  component: DessertAdvisor,
};
export default meta;

export const Default: StoryObj<typeof DessertAdvisor> = {};
