import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "@/shared/i18n/messages/ko.json";

import RouteError from "./RouteError";

const reportError = vi.hoisted(() => vi.fn());
vi.mock("../monitoring", () => ({ reportError }));
vi.mock("@/shared/i18n", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props} href={href}>
      {children}
    </a>
  ),
}));

describe("RouteError", () => {
  it("오류를 보고하고 제목으로 초점을 옮기며, 다시 시도를 누르면 reset을 부릅니다", async () => {
    const error = new Error("boom");
    const reset = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <RouteError error={error} reset={reset} />
      </NextIntlClientProvider>,
    );
    expect(reportError).toHaveBeenCalledWith(error);
    expect(screen.getByRole("heading", { name: "문제가 생겼습니다" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "홈으로 돌아가기" })).toHaveAttribute("href", "/");
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(reset).toHaveBeenCalled();
  });
});
