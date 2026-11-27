import { HttpResponse, http as mock } from "msw";
import { describe, expect, it } from "vitest";

import { captureRequests } from "@/_app/mocks/capture";
import { server } from "@/_app/mocks/node";

import { http, keepResponse } from "./http";

describe("공통 HTTP 클라이언트", () => {
  it("2xx가 아닌 응답도 keepResponse로 그대로 돌려받습니다", async () => {
    server.use(mock.post("/x", () => HttpResponse.json({}, { status: 402 })));
    const response = await http.url("/x").post().res().catch(keepResponse);
    expect(response.status).toBe(402);
  });

  it("네트워크 오류는 그대로 던집니다", async () => {
    server.use(mock.post("/x", () => HttpResponse.error()));
    await expect(http.url("/x").post().res().catch(keepResponse)).rejects.toThrow(TypeError);
  });

  it("JSON 본문을 content-type과 함께 보냅니다", async () => {
    const { calls, capture } = captureRequests();
    server.use(
      mock.post("/x", async ({ request }) => {
        await capture(request);
        return new HttpResponse(null);
      }),
    );
    await http.url("/x").json({ a: 1 }).post().res();
    expect(calls).toEqual([
      { path: "/x", method: "POST", contentType: "application/json", body: '{"a":1}' },
    ]);
  });
});
