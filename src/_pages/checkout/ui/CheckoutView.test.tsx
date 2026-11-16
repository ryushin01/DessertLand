import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ORDER_LINES, cartLinesAtom } from "@/entities/cart";
import { PRODUCTS } from "@/entities/product";
import messages from "@/shared/i18n/messages/ko.json";

import { CheckoutView } from "./CheckoutView";

vi.mock("@/shared/i18n", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));

function renderWithCart(count: number) {
  const store = createStore();
  store.set(
    cartLinesAtom,
    PRODUCTS.slice(0, count).map(({ slug }) => ({ slug, quantity: 1 })),
  );
  render(
    <Provider store={store}>
      <NextIntlClientProvider locale="ko" messages={messages}>
        <CheckoutView stripeEnabled canceled={false} />
      </NextIntlClientProvider>
    </Provider>,
  );
}

describe("CheckoutView 주문 종류 수 상한", () => {
  beforeEach(() => localStorage.clear());

  it("상한까지는 결제 버튼을 보여 줍니다", () => {
    renderWithCart(MAX_ORDER_LINES);
    expect(screen.getByRole("button", { name: /Stripe에서/ })).toBeInTheDocument();
  });

  it("상한을 넘으면 결제 버튼 대신 장바구니에서 고르라고 안내합니다", () => {
    renderWithCart(MAX_ORDER_LINES + 1);
    expect(screen.queryByRole("button", { name: /Stripe에서/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(`한 번에 주문할 수 있는 디저트는 ${MAX_ORDER_LINES}종까지입니다.`, {
        exact: false,
      }),
    ).toBeInTheDocument();
  });
});
