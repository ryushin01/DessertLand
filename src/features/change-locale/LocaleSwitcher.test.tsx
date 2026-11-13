import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { LOCALES } from "@/shared/i18n";

import { LocaleSwitcher } from "./LocaleSwitcher";

// 공개 API 전체를 불러오면 next/navigation이 필요하므로, 언어 목록(routing)만 진짜를 씁니다.
vi.mock("@/shared/i18n", async () => {
  const routing = await import("@/shared/i18n/routing");
  return {
    ...routing,
    usePathname: () => "/",
    Link: ({ children, locale, ...props }: { children: React.ReactNode; locale: string; href: unknown }) => (
      <a {...props} href={`/${locale}`}>
        {children}
      </a>
    ),
  };
});

function renderSwitcher() {
  return render(
    <NextIntlClientProvider locale="ko" messages={{ nav: { language: "언어" } }}>
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitcher", () => {
  it("나라마다 원형 국기와 나라 이름을 보여 주고, 국기는 꾸밈으로 숨긴다", () => {
    const { container } = renderSwitcher();
    const links = within(container.querySelector("ul")!).getAllByRole("link", { hidden: true });
    expect(links).toHaveLength(LOCALES.length);
    for (const link of links) {
      expect(link.querySelector("svg")?.closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getByRole("link", { name: "United States, English", hidden: true })).toHaveAttribute("lang", "en");
  });

  it("지금 언어는 aria-current로 알린다", () => {
    renderSwitcher();
    expect(screen.getByRole("link", { name: "대한민국, 한국어", hidden: true })).toHaveAttribute("aria-current", "true");
  });
});
