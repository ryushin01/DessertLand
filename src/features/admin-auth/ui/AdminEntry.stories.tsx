import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";

import { AdminEntry } from "./AdminEntry";

/**
 * 어드민 들어가기. 세션 요청(/api/admin/session)은 MSW 공통 목업이 받습니다(비밀번호 "correct horse battery"만 맞음).
 * 어드민 전역 스타일(admin.css)은 html·body에 붙어 스토리에서는 싣지 않으므로, 같은 변수만 틀에 둡니다.
 */
const frame: CSSProperties & Record<`--${string}`, string> = {
  "--ink": "#000",
  "--paper": "#fff",
  "--mute": "#767676",
  "--line-strong": "#949494",
  "--line-dark": "#5c5c5c",
  "--error": "#8b0000",
  "--error-on-dark": "#ff8080",
  "--ease-out": "cubic-bezier(0.23, 1, 0.32, 1)",
  "--ease-io": "cubic-bezier(0.86, 0, 0.07, 1)",
  "--gutter": "40px",
  "--font-display": "serif",
  "--font-body": "system-ui, sans-serif",
  fontFamily: "system-ui, sans-serif",
};

const meta: Meta<typeof AdminEntry> = {
  title: "admin/AdminEntry",
  component: AdminEntry,
  args: { demo: true, passwordEnabled: true },
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div style={frame}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof AdminEntry>;
export const Demo: Story = {};
export const PasswordOnly: Story = { args: { demo: false } };
