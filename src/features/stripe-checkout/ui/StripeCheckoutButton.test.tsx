/// <reference types="vitest/jsdom" />
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/shared/i18n/messages/en.json";

import { StripeCheckoutButton } from "./StripeCheckoutButton";

const setup = (canceled = false) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StripeCheckoutButton
        items={[{ slug: "baklava", quantity: 1 }]}
        total={15}
        source="cart"
        canceled={canceled}
      />
    </NextIntlClientProvider>,
  );

const respond = (body: object) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ json: async () => body })),
  );

afterEach(() => vi.unstubAllGlobals());

describe("StripeCheckoutButton", () => {
  it("취소하고 돌아오면 안내합니다", () => {
    setup(true);
    expect(screen.getByRole("alert")).toHaveTextContent("Payment canceled");
  });

  it("금액이 다르면 안내하고 다시 누를 수 있습니다", async () => {
    respond({ status: "amount_mismatch" });
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Pay $15 with Stripe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The amount changed");
    expect(screen.getByRole("button", { name: "Pay $15 with Stripe" })).toBeEnabled();
  });

  it("요청이 끝나기 전에는 다시 보낼 수 없습니다", async () => {
    const fetchMock = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Pay $15 with Stripe" }));
    const pending = screen.getByRole("button", { name: "Going to the payment page" });
    expect(pending).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("브라우저 뒤로 가기로 복원되면 버튼을 다시 켭니다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Pay $15 with Stripe" }));
    act(() => {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: true });
      window.dispatchEvent(event);
    });
    expect(screen.getByRole("button", { name: "Pay $15 with Stripe" })).toBeEnabled();
  });

  it("결제 화면으로 가기 전에 세션 ID와 함께 산 상품 줄(수량)을 저장합니다", async () => {
    localStorage.clear();
    // jsdom은 다른 문서로 이동하지 못하므로, 주소를 https로 바꿔 결제 창으로 가는 이동을 같은 문서 안의 해시 이동으로 만듭니다.
    const original = window.location.href;
    jsdom.reconfigure({ url: "https://dessert-land.test/en/checkout" });
    try {
      respond({
        status: "created",
        url: "https://dessert-land.test/en/checkout#stripe",
        id: "cs_test_savedsaved01",
      });
      setup();
      await userEvent.click(screen.getByRole("button", { name: "Pay $15 with Stripe" }));
      await waitFor(() => expect(window.location.hash).toBe("#stripe"));
      expect(JSON.parse(localStorage.getItem("dessert-land.orders") ?? "[]")).toMatchObject([
        {
          kind: "stripe",
          sessionId: "cs_test_savedsaved01",
          source: "cart",
          settled: false,
          items: [{ slug: "baklava", quantity: 1 }],
        },
      ]);
    } finally {
      jsdom.reconfigure({ url: original });
    }
  });
});
