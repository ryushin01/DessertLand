import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, describe, expect, it, vi } from "vitest";

import messages from "@/shared/i18n/messages/ko.json";
import { SectionDots } from "./SectionDots";

beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

describe("SectionDots", () => {
  it("홈의 각 섹션으로 가는 링크를 섹션 이름과 함께 보여 주고 첫 섹션을 현재 위치로 표시한다", () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <SectionDots />
      </NextIntlClientProvider>,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(screen.getByRole("link", { name: "디저트 카테고리" })).toHaveAttribute("href", "#categories");
    expect(screen.getByRole("link", { name: "어떤 디저트가 좋을까요?" })).toHaveAttribute("href", "#advisor");
    expect(links[0]).toHaveAttribute("aria-current", "true");
  });
});
