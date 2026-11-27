// @vitest-environment node
import { describe, expect, it } from "vitest";

import { POST } from "./route";

const order = {
  items: [{ slug: "baklava", quantity: 1 }],
  method: "card",
  locale: "ko",
  // 바클라바 ₩9,800 + 배송 ₩3,500
  expectedTotal: 13300,
};

const post = (body: string, ip = "1.1.1.1") =>
  POST(
    new Request("https://site.test/api/payments", {
      method: "POST",
      body,
      headers: { "x-real-ip": ip },
    }),
  );

describe("내장 테스트 결제 API", () => {
  it("승인을 고르면 서버가 다시 계산한 금액과 주문 번호를 돌려줍니다", async () => {
    const response = await post(JSON.stringify({ ...order, outcome: "approve" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "approved", total: 13300 });
  });

  it("실패를 고르면 402, 금액이 다르면 409로 답합니다", async () => {
    expect((await post(JSON.stringify({ ...order, outcome: "decline" }))).status).toBe(402);
    const mismatch = await post(JSON.stringify({ ...order, expectedTotal: 1, outcome: "approve" }));
    expect(mismatch.status).toBe(409);
    expect(await mismatch.json()).toEqual({ status: "amount_mismatch", total: 13300 });
  });

  it("JSON이 아니거나 형식이 틀린 요청은 400입니다", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post(JSON.stringify({ items: [] }))).status).toBe(400);
  });

  it("한 곳에서 1분에 60번까지만 받습니다", async () => {
    const statuses: number[] = [];
    for (let index = 0; index < 61; index += 1) {
      statuses.push((await post("{}", "7.7.7.7")).status);
    }
    expect(statuses.slice(0, 60).every((status) => status === 400)).toBe(true);
    expect(statuses[60]).toBe(429);
  });
});
