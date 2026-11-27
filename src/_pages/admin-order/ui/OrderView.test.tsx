import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ADMIN_ORDERS_KEY, type AdminOrder } from "@/entities/admin-order";

import { OrderView } from "./OrderView";

const ORDER: AdminOrder = {
  id: "DL-TEST01",
  orderNo: "DL-TEST01",
  createdAt: Date.now() - 60_000,
  locale: "en",
  currency: "USD",
  channel: "test",
  origin: "seed",
  customer: "고객 #1001",
  items: [{ slug: "baklava", quantity: 2, unitPrice: 7 }],
  shipping: 8,
  total: 22,
  totalUsd: 22,
  status: "paid",
  history: [{ status: "paid", at: Date.now() - 60_000 }],
  refunds: [],
};

beforeAll(() => {
  // jsdom에는 <dialog>의 showModal·close가 없어 최소 동작만 채웁니다.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("주문 처리", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify({ seededAt: 0, orders: [ORDER] }));
  });

  it("다음 단계로 바꾸면 상태와 처리 기록이 바뀝니다", async () => {
    render(<OrderView id="DL-TEST01" />);
    await userEvent.click(screen.getByRole("button", { name: "준비 중(으)로 바꾸기" }));
    expect(screen.getByRole("status")).toHaveTextContent("준비 중");
    expect(screen.getByRole("button", { name: "배송 중(으)로 바꾸기" })).toBeInTheDocument();
  });

  it("남은 금액보다 많이 환불하면 막고, 맞는 금액은 내장 테스트 결제 기록으로 환불합니다", async () => {
    render(<OrderView id="DL-TEST01" />);
    const trigger = screen.getByRole("button", { name: "환불하기" });
    await userEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "DL-TEST01 환불" });
    const amount = within(dialog).getByLabelText("환불 금액(USD)");
    await userEvent.clear(amount);
    await userEvent.type(amount, "30");
    await userEvent.click(within(dialog).getByRole("button", { name: "환불하기" }));
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAccessibleDescription(/남은 금액/);
    expect(amount).toHaveFocus();

    await userEvent.clear(amount);
    await userEvent.type(amount, "22");
    await userEvent.click(within(dialog).getByRole("button", { name: "환불하기" }));
    expect(await screen.findByText(/내장 테스트 결제 기록/)).toBeInTheDocument();
    expect(screen.getAllByText("환불 완료").length).toBeGreaterThan(0);
  });
});
