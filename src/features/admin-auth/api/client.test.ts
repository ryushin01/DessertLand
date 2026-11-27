import { describe, expect, it } from "vitest";

import { safeNext } from "./client";

describe("들어간 뒤 돌아갈 주소", () => {
  it("어드민 안의 주소만 받습니다", () => {
    expect(safeNext("/admin/orders?status=paid")).toBe("/admin/orders?status=paid");
    expect(safeNext("https://evil.example")).toBe("/admin");
    expect(safeNext("//evil.example/admin")).toBe("/admin");
    expect(safeNext("/administrator")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});
