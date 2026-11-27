import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminEntry } from "./AdminEntry";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("next=/admin/orders"),
}));

const signIn = vi.fn();
vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  signIn: (...args: unknown[]) => signIn(...args),
}));

describe("어드민 들어가기", () => {
  beforeEach(() => {
    replace.mockReset();
    signIn.mockReset();
  });

  it("공개 데모는 '관리자로 둘러보기'로 들어가 원래 가려던 화면으로 갑니다", async () => {
    signIn.mockResolvedValue("ok");
    render(<AdminEntry demo passwordEnabled={false} />);
    expect(screen.getByText(/데이터 초기화/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "관리자로 둘러보기" }));
    expect(signIn).toHaveBeenCalledWith({ mode: "demo" });
    expect(replace).toHaveBeenCalledWith("/admin/orders");
  });

  it("비밀번호가 비거나 틀리면 그 칸에 오류를 잇고 초점을 옮깁니다", async () => {
    signIn.mockResolvedValue("wrong");
    render(<AdminEntry demo={false} passwordEnabled />);
    const field = screen.getByLabelText("관리자 비밀번호");
    await userEvent.click(screen.getByRole("button", { name: "들어가기" }));
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("비밀번호를 입력해 주세요.");
    expect(field).toHaveFocus();
    await userEvent.type(field, "nope");
    await userEvent.click(screen.getByRole("button", { name: "들어가기" }));
    expect(await screen.findByText(/비밀번호가 맞지 않습니다/)).toBeInTheDocument();
    expect(field).toHaveFocus();
    expect(replace).not.toHaveBeenCalled();
  });

  it("데모도 비밀번호도 없으면 설정 방법을 알립니다", () => {
    render(<AdminEntry demo={false} passwordEnabled={false} />);
    expect(screen.getByText(/ADMIN_PASSWORD/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
