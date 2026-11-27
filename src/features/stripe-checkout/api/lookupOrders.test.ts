import { afterEach, describe, expect, it, vi } from "vitest";

import { lookupOrders } from "./lookupOrders";

const ID = "cs_test_lookuplookup01";

afterEach(() => vi.unstubAllGlobals());

describe("lookupOrders", () => {
  it("세션 ID를 JSON으로 보내고 모양이 맞는 주문만 돌려줍니다", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ orders: [{ sessionId: ID, state: "paid" }, { sessionId: "bad" }] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupOrders([ID])).resolves.toEqual([{ sessionId: ID, state: "paid" }]);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/orders");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({ ids: [ID] });
  });

  it("조회할 세션이 없으면 요청하지 않습니다", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupOrders([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "Stripe가 꺼져 있으면(503)",
      () => Promise.resolve(Response.json({ status: "disabled" }, { status: 503 })),
    ],
    ["네트워크가 끊기면", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["본문이 JSON이 아니면", () => Promise.resolve(new Response("oops"))],
  ])("%s null입니다", async (_, answer) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(answer));
    await expect(lookupOrders([ID])).resolves.toBeNull();
  });
});
