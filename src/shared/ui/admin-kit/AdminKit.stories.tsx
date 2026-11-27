// 어드민 글꼴(@font-face 선언만 더함. 쇼핑몰 스토리의 모양은 바꾸지 않음)
import "@fontsource-variable/bodoni-moda/index.css";
import "@fontsource/noto-serif-kr/300.css";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type CSSProperties, type ReactNode } from "react";

import {
  Breadcrumbs,
  ChipGroup,
  Pill,
  PillButton,
  SlashList,
  SlashName,
  SplitTitle,
  TextButton,
  TextField,
} from ".";
import { Modal } from "./Modal";

/**
 * 어드민 전역 스타일(admin.css)은 html·body에 붙으므로 스토리에서는 싣지 않고, 같은 변수만 이 틀에 둡니다.
 * 그래서 같은 Storybook 안의 쇼핑몰 스토리(검은 바탕)에 영향을 주지 않습니다.
 */
const frame: CSSProperties & Record<`--${string}`, string> = {
  "--ink": "#000",
  "--paper": "#fff",
  "--mute": "#767676",
  "--line": "#e5e5e5",
  "--line-strong": "#949494",
  "--line-dark": "#5c5c5c",
  "--error": "#8b0000",
  "--error-on-dark": "#ff8080",
  "--ease-out": "cubic-bezier(0.23, 1, 0.32, 1)",
  "--ease-io": "cubic-bezier(0.86, 0, 0.07, 1)",
  "--gutter": "40px",
  "--font-display": '"Bodoni Moda Variable", "Noto Serif KR", serif',
  "--font-body": "system-ui, sans-serif",
  background: "#fff",
  color: "#000",
  fontFamily: "system-ui, sans-serif",
  padding: "40px",
  display: "grid",
  gap: "40px",
};

const Frame = ({ children }: { children: ReactNode }) => <div style={frame}>{children}</div>;

const meta: Meta = { title: "admin/Kit", decorators: [(Story) => <Frame>{Story()}</Frame>] };
export default meta;

type Story = StoryObj;

export const TitleWithSlash: Story = {
  render: () => (
    <SplitTitle
      eyebrow="Products · 175"
      title="상품"
      crumbs={[{ label: "상품", href: "/admin/products" }, { label: "수정" }]}
    />
  ),
};

export const CollectionList: Story = {
  render: () => (
    <SlashList label="인기 상품">
      {["티라미수", "바클라바", "마카롱"].map((name, index) => (
        <li
          key={name}
          style={{ fontFamily: '"Noto Serif KR", serif', fontSize: 72, fontWeight: 300 }}
        >
          <a href="#top">
            <SlashName order={index} badge={{ short: "케", long: "케이크" }} srText="케이크">
              {name}
            </SlashName>
          </a>
        </li>
      ))}
    </SlashList>
  ),
};

export const Controls: Story = {
  render: () => (
    <>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <PillButton>저장</PillButton>
        <PillButton ghost>취소로 바꾸기</PillButton>
        <TextButton>환불하기</TextButton>
        <Pill>판매 중</Pill>
        <Pill tone="solid">품절</Pill>
        <Pill tone="dashed">숨김</Pill>
      </div>
      <Breadcrumbs items={[{ label: "주문", href: "/admin/orders" }, { label: "상세" }]} />
    </>
  ),
};

function FormDemo() {
  const [tastes, setTastes] = useState<("fruity" | "creamy" | "light")[]>(["creamy"]);
  return (
    <>
      <TextField
        label="정가(달러)"
        defaultValue="abc"
        error="가격을 숫자로 입력해 주세요."
        hint="원래 US$9"
      />
      <ChipGroup
        legend="맛"
        name="tastes"
        options={["fruity", "creamy", "light"] as const}
        labels={{ fruity: "상큼한 과일", creamy: "부드러운 크림", light: "가벼운 맛" }}
        value={tastes}
        onChange={setTastes}
      />
    </>
  );
}

export const Form: Story = { render: () => <FormDemo /> };

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TextButton aria-haspopup="dialog" onClick={() => setOpen(true)}>
        환불하기
      </TextButton>
      <Modal open={open} onClose={() => setOpen(false)} title="DL-5A0000 환불">
        <TextField label="환불 금액(USD)" defaultValue="22" />
      </Modal>
    </>
  );
}

export const Dialog: Story = { render: () => <ModalDemo /> };
