import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { OVERRIDES_KEY } from "@/entities/product";

import { ProductEditView } from "./ProductEditView";

describe("상품 수정", () => {
  beforeEach(() => localStorage.clear());

  it("잘못된 가격은 그 칸에 무엇이 틀렸는지 잇고 초점을 옮깁니다", async () => {
    render(<ProductEditView slug="tiramisu" />);
    const price = await screen.findByLabelText("정가(달러)");
    await userEvent.clear(price);
    await userEvent.type(price, "abc");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(price).toHaveAttribute("aria-invalid", "true");
    expect(price).toHaveAccessibleDescription(/가격을 숫자로 입력해 주세요/);
    expect(price).toHaveFocus();
    expect(localStorage.getItem(OVERRIDES_KEY)).toBeNull();
  });

  it("가격·할인·이름을 저장하면 쇼핑몰이 읽는 저장소에 바뀐 칸만 남습니다", async () => {
    render(<ProductEditView slug="tiramisu" />);
    const discount = await screen.findByLabelText("할인율(%)");
    await userEvent.clear(discount);
    await userEvent.type(discount, "20");
    const name = screen.getByLabelText("이름(한국어)");
    await userEvent.clear(name);
    await userEvent.type(name, "어드민 티라미수");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByText(/쇼핑몰에 바로 반영됩니다/)).toBeInTheDocument();
    const saved: unknown = JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}");
    expect(saved).toEqual({ tiramisu: { discount: 20, name: { ko: "어드민 티라미수" } } });
  });
});
