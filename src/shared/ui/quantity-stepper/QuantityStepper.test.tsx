import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuantityStepper } from "./QuantityStepper";

const labels = { label: "수량", decreaseLabel: "줄이기", increaseLabel: "늘리기" };

describe("QuantityStepper", () => {
  it("버튼으로 값을 바꿉니다", async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} max={5} onChange={onChange} {...labels} />);
    await userEvent.click(screen.getByRole("button", { name: "늘리기" }));
    await userEvent.click(screen.getByRole("button", { name: "줄이기" }));
    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });

  it("범위 끝에서는 버튼을 비활성화합니다", () => {
    render(<QuantityStepper value={1} max={1} onChange={() => {}} {...labels} />);
    expect(screen.getByRole("button", { name: "줄이기" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "늘리기" })).toBeDisabled();
  });
});
