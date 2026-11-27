import { afterEach, describe, expect, it, vi } from "vitest";

import type { PaymentRequest } from "../model/types";
import { requestPayment } from "./requestPayment";

const data: PaymentRequest = {
  items: [{ slug: "baklava", quantity: 1 }],
  method: "card",
  locale: "ko",
  expectedTotal: 15000,
  outcome: "approve",
};

const respond = (body: unknown, status = 200) => {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe("requestPayment", () => {
  it("결제 요청을 JSON으로 보내고 승인 결과를 돌려줍니다", async () => {
    const fetchMock = respond({ status: "approved", orderNo: "DL-1", total: 15000 });
    await expect(requestPayment(data)).resolves.toEqual({
      status: "approved",
      orderNo: "DL-1",
      total: 15000,
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/payments");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual(data);
  });

  it.each([
    [{ status: "declined" }, 402],
    [{ status: "amount_mismatch", total: 16000 }, 409],
    [{ status: "invalid" }, 429],
  ])("2xx가 아닌 응답(%o, %i)도 본문의 결과를 돌려줍니다", async (body, status) => {
    respond(body, status);
    await expect(requestPayment(data)).resolves.toEqual(body);
  });

  it("알 수 없는 응답이면 오류를 던집니다", async () => {
    respond({ status: "weird" });
    await expect(requestPayment(data)).rejects.toThrow("알 수 없는 결제 응답입니다.");
  });

  it("네트워크가 끊기면 오류를 던집니다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(requestPayment(data)).rejects.toThrow("Failed to fetch");
  });
});
