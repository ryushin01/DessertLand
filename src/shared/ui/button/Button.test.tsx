import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("기본 type은 폼을 제출하지 않는 button입니다", () => {
    render(<Button>담기</Button>);
    expect(screen.getByRole("button", { name: "담기" })).toHaveAttribute("type", "button");
  });

  it("지정한 type을 유지합니다", () => {
    render(<Button type="submit">주문</Button>);
    expect(screen.getByRole("button", { name: "주문" })).toHaveAttribute("type", "submit");
  });
});
