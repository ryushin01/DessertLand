// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const config = vi.hoisted(() => ({
  demo: true,
  password: "correct horse battery" as string | undefined,
}));
vi.mock("./config.server", () => ({ adminAuthConfig: () => config }));

import { POST } from "./route";

const post = (body: unknown, ip: string) =>
  POST(
    new NextRequest("https://site.test/api/admin/session", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "x-real-ip": ip },
    }),
  );

describe("어드민 들어가기 API", () => {
  afterEach(() => {
    config.demo = true;
    config.password = "correct horse battery";
  });

  it("공개 데모 입장은 요청 한도에 세지 않습니다(같은 곳에서 여러 번 들어가도 됨)", async () => {
    for (let index = 0; index < 15; index += 1) {
      expect((await post({ mode: "demo" }, "9.9.9.9")).status).toBe(200);
    }
  });

  it("비밀번호 들어가기는 1분에 10번까지만 받습니다", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 11; index += 1) {
      statuses.push((await post({ mode: "password", password: "wrong" }, "8.8.8.8")).status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("데모가 아닌 빌드에서는 데모 입장을 받지 않습니다", async () => {
    config.demo = false;
    expect((await post({ mode: "demo" }, "7.7.7.7")).status).toBe(403);
  });

  it("맞는 비밀번호면 HttpOnly 세션 쿠키를 넣습니다", async () => {
    const response = await post({ mode: "password", password: "correct horse battery" }, "6.6.6.6");
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/dl_admin=v1\.\d+\..+HttpOnly/i);
  });
});
