import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LocaleSwitcher } from "./LocaleSwitcher";

const meta: Meta<typeof LocaleSwitcher> = {
  title: "widgets/SiteHeader/LocaleSwitcher",
  component: LocaleSwitcher,
  // 언어 링크가 지금 주소(usePathname)를 읽으므로 앱 라우터 맥락과 주소를 줍니다. 없으면 null을 읽어 오류 화면이 뜹니다.
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/ko/shop" } } },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 520, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

/** 언어 메뉴를 펼쳐 국기와 언어 이름을 보여 줍니다. */
export const Open: StoryObj<typeof LocaleSwitcher> = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("details")?.setAttribute("open", "");
  },
};
