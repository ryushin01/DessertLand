import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "./Logo";

describe("Logo", () => {
  it("장식 요소로 숨기고 지정한 크기로 그립니다", () => {
    const { container } = render(<Logo size={48} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("width", "48");
  });

  it("이미지 변환 없이 원본 파일 주소를 씁니다", () => {
    const { container } = render(<Logo />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/brand/logo.png");
  });
});
