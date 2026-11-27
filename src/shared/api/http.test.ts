import { afterEach, describe, expect, it, vi } from "vitest";

import { http, keepResponse } from "./http";

afterEach(() => vi.unstubAllGlobals());

describe("공통 HTTP 클라이언트", () => {
  it("2xx가 아닌 응답도 keepResponse로 그대로 돌려받습니다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 402 })),
    );
    const response = await http.url("/x").post().res().catch(keepResponse);
    expect(response.status).toBe(402);
  });

  it("네트워크 오류는 그대로 던집니다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(http.url("/x").post().res().catch(keepResponse)).rejects.toThrow(
      "Failed to fetch",
    );
  });

  it("JSON 본문을 content-type과 함께 보냅니다", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetchMock);
    await http.url("/x").json({ a: 1 }).post().res();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/x");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(init?.body).toBe('{"a":1}');
  });
});
