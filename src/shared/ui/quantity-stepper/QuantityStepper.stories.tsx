import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { QuantityStepper } from "./QuantityStepper";

const meta: Meta<typeof QuantityStepper> = {
  title: "shared/QuantityStepper",
  component: QuantityStepper,
};
export default meta;

function Example() {
  const [value, setValue] = useState(1);
  return (
    <QuantityStepper
      value={value}
      max={20}
      onChange={setValue}
      label="수량"
      decreaseLabel="수량 줄이기"
      increaseLabel="수량 늘리기"
    />
  );
}

export const Default: StoryObj<typeof QuantityStepper> = { render: () => <Example /> };
