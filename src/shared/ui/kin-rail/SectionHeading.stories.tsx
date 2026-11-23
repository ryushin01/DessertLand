import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ScrollCue } from "./ScrollCue";
import { SectionHeading } from "./SectionHeading";

const meta: Meta<typeof SectionHeading> = {
  title: "shared/SectionHeading",
  component: SectionHeading,
  decorators: [
    (Story) => (
      <div style={{ background: "#00020e", color: "#fff", padding: "160px 56px 220px", overflow: "clip" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

const titleStyle = {
  fontSize: "4rem",
  fontWeight: 200,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  lineHeight: 1.05,
} as const;

export const Default: StoryObj<typeof SectionHeading> = {
  args: {
    index: 1,
    children: <h1 style={titleStyle}>Dessert Land</h1>,
    after: <ScrollCue label="Scroll for more" />,
  },
};

export const Contained: StoryObj<typeof SectionHeading> = {
  args: { index: 3, line: "contained", children: <h1 style={titleStyle}>Tiramisù</h1> },
};
