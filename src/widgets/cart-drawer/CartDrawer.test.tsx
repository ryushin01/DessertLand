import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cartExcludedAtom, cartLinesAtom } from "@/entities/cart";
import messages from "@/shared/i18n/messages/ko.json";

import { CartDrawer } from "./CartDrawer";

// 공개 API 전체를 불러오면 next/navigation이 필요하므로, 링크만 흉내 냅니다.
vi.mock("@/shared/i18n", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({ default: () => null }));

function renderDrawer() {
  const store = createStore();
  store.set(cartLinesAtom, [
    { slug: "baklava", quantity: 2 },
    { slug: "tiramisu", quantity: 1 },
  ]);
  render(
    <Provider store={store}>
      <NextIntlClientProvider locale="ko" messages={messages}>
        <CartDrawer />
      </NextIntlClientProvider>
    </Provider>,
  );
  // 닫힌 dialog 안이라 접근성 트리에서 숨어 있으므로 hidden으로 찾습니다.
  const dialog = screen.getByRole("dialog", { hidden: true });
  return { store, dialog: within(dialog) };
}

describe("CartDrawer 골라서 주문", () => {
  // 고른 상태는 localStorage에 남으므로 테스트마다 비웁니다.
  beforeEach(() => localStorage.clear());

  it("처음에는 모두 골라 두고, 하나를 빼면 합계와 주문 버튼이 고른 상품만 셉니다", async () => {
    const user = userEvent.setup();
    const { store, dialog } = renderDrawer();
    expect(dialog.getByRole("link", { name: "선택 상품 주문하기 (2)", hidden: true })).toBeInTheDocument();

    await user.click(dialog.getByRole("checkbox", { name: "티라미수 주문에 넣기", hidden: true }));

    expect(store.get(cartExcludedAtom)).toEqual(["tiramisu"]);
    expect(dialog.getByRole("link", { name: "선택 상품 주문하기 (1)", hidden: true })).toBeInTheDocument();
    expect(dialog.getByText("1/2개 선택")).toBeInTheDocument();
    // 담은 상품 목록에는 그대로 남습니다.
    expect(dialog.getByText("티라미수")).toBeInTheDocument();
  });

  it("전체 선택을 끄면 주문 버튼 대신 고르라는 안내를 보여 줍니다", async () => {
    const user = userEvent.setup();
    const { dialog } = renderDrawer();
    await user.click(dialog.getByRole("checkbox", { name: /전체 선택/, hidden: true }));
    expect(dialog.queryByRole("link", { name: /선택 상품 주문하기/, hidden: true })).toBeNull();
    expect(dialog.getByText("주문할 상품을 골라 주세요.")).toBeInTheDocument();
  });
});
