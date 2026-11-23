import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("제목은 그대로 읽히고 꺾쇠·섹션 번호 장식은 보조 기술에서 숨긴다", () => {
    const { container } = render(
      <SectionHeading index={2}>
        <h1>세계의 디저트</h1>
      </SectionHeading>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "세계의 디저트" })).toBeInTheDocument();
    expect(screen.queryByText(/Section/)).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("섹션 번호를 두 자리로 보여 준다", () => {
    render(
      <SectionHeading index={4}>
        <h2>결제</h2>
      </SectionHeading>,
    );
    expect(screen.getByText("Section — 04")).toBeInTheDocument();
  });
});
