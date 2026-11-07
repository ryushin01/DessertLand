import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon } from "./Icon";
import { ICON_NAMES } from "./icon-names";

const meta: Meta<typeof Icon> = { title: "shared/Icon", component: Icon };
export default meta;

export const All: StoryObj<typeof Icon> = {
  render: () => (
    <ul style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 24 }}>
      {ICON_NAMES.map((name) => (
        <li key={name} title={name}>
          <Icon name={name} />
        </li>
      ))}
    </ul>
  ),
};
