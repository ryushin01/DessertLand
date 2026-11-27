import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/_app/mocks/node";

import { safeNext, signIn, signOut } from "./client";

const respond = (status: number, body: { status: string }) =>
  server.use(http.post("*/api/admin/session", () => HttpResponse.json(body, { status })));

describe("들어가기 요청", () => {
  it("상태 코드와 관계없이 본문의 결과를 돌려줍니다", async () => {
    respond(200, { status: "ok" });
    expect(await signIn({ mode: "demo" })).toBe("ok");
    respond(401, { status: "wrong" });
    expect(await signIn({ mode: "password", password: "x" })).toBe("wrong");
    respond(429, { status: "limited" });
    expect(await signIn({ mode: "password", password: "x" })).toBe("limited");
  });

  it("모르는 답, JSON이 아닌 답, 네트워크 오류는 error입니다", async () => {
    respond(500, { status: "boom" });
    expect(await signIn({ mode: "demo" })).toBe("error");
    server.use(http.post("*/api/admin/session", () => new HttpResponse("<html>", { status: 502 })));
    expect(await signIn({ mode: "demo" })).toBe("error");
    server.use(http.post("*/api/admin/session", () => HttpResponse.error()));
    expect(await signIn({ mode: "demo" })).toBe("error");
  });

  it("나가기는 실패해도 던지지 않습니다", async () => {
    server.use(http.delete("*/api/admin/session", () => HttpResponse.error()));
    await expect(signOut()).resolves.toBeUndefined();
  });
});

describe("들어간 뒤 돌아갈 주소", () => {
  it("어드민 안의 주소만 받습니다", () => {
    expect(safeNext("/admin/orders?status=paid")).toBe("/admin/orders?status=paid");
    expect(safeNext("https://evil.example")).toBe("/admin");
    expect(safeNext("//evil.example/admin")).toBe("/admin");
    expect(safeNext("/administrator")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});
