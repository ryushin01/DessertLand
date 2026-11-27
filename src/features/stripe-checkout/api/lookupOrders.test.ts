import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { captureRequests } from "@/_app/mocks/capture";
import { server } from "@/_app/mocks/node";

import { lookupOrders } from "./lookupOrders";

const ID = "cs_test_lookuplookup01";

describe("lookupOrders", () => {
  it("세션 ID를 JSON으로 보내고 모양이 맞는 주문만 돌려줍니다", async () => {
    const { calls, capture } = captureRequests();
    server.use(
      http.post("/api/orders", async ({ request }) => {
        await capture(request);
        return HttpResponse.json({
          orders: [{ sessionId: ID, state: "paid" }, { sessionId: "bad" }],
        });
      }),
    );
    await expect(lookupOrders([ID])).resolves.toEqual([{ sessionId: ID, state: "paid" }]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      path: "/api/orders",
      method: "POST",
      contentType: "application/json",
    });
    expect(JSON.parse(calls[0]?.body ?? "")).toEqual({ ids: [ID] });
  });

  it("조회할 세션이 없으면 요청하지 않습니다", async () => {
    const { calls, capture } = captureRequests();
    server.use(
      http.post("/api/orders", async ({ request }) => {
        await capture(request);
        return HttpResponse.json({ orders: [] });
      }),
    );
    await expect(lookupOrders([])).resolves.toEqual([]);
    expect(calls).toEqual([]);
  });

  it.each([
    ["Stripe가 꺼져 있으면(503)", () => HttpResponse.json({ status: "disabled" }, { status: 503 })],
    ["네트워크가 끊기면", () => HttpResponse.error()],
    ["본문이 JSON이 아니면", () => new HttpResponse("oops")],
  ])("%s null입니다", async (_, answer) => {
    server.use(http.post("/api/orders", answer));
    await expect(lookupOrders([ID])).resolves.toBeNull();
  });
});
