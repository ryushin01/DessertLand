import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { captureRequests } from "@/_app/mocks/capture";
import { server } from "@/_app/mocks/node";

import type { PaymentRequest } from "../model/types";
import { requestPayment } from "./requestPayment";

const data: PaymentRequest = {
  items: [{ slug: "baklava", quantity: 1 }],
  method: "card",
  locale: "ko",
  expectedTotal: 15000,
  outcome: "approve",
};

const respond = (body: Record<string, unknown>, status = 200) =>
  server.use(http.post("/api/payments", () => HttpResponse.json(body, { status })));

describe("requestPayment", () => {
  it("결제 요청을 JSON으로 보내고 승인 결과를 돌려줍니다", async () => {
    // 기본 목업(_app/mocks/handlers/app.ts)이 받은 금액 그대로 승인합니다.
    const { calls, capture } = captureRequests();
    server.events.on("request:start", ({ request }) => void capture(request));
    await expect(requestPayment(data)).resolves.toEqual({
      status: "approved",
      orderNo: "DL-MSW0001",
      total: 15000,
    });
    server.events.removeAllListeners();
    expect(calls[0]).toMatchObject({
      path: "/api/payments",
      method: "POST",
      contentType: "application/json",
    });
    expect(JSON.parse(calls[0]?.body ?? "")).toEqual(data);
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
    server.use(http.post("/api/payments", () => HttpResponse.error()));
    await expect(requestPayment(data)).rejects.toThrow(TypeError);
  });
});
