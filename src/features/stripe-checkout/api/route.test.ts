// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { outageHandlers } from "@/_app/mocks/handlers";
import { server } from "@/_app/mocks/node";

vi.mock("server-only", () => ({}));
// 라우트 밖(Next 요청 설정 없이)에서 부르므로, 실제 메시지 파일로 만든 번역기를 돌려줍니다.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
      createTranslator({
        locale,
        namespace,
        messages: (await import(`@/shared/i18n/messages/${locale}.json`)).default,
      }),
  };
});

import { POST } from "./route";

// 바로 구매 1개(바클라바 ₩9,800 + 배송 ₩3,500)
const order = { items: [{ slug: "baklava", quantity: 1 }], locale: "ko", source: "buy" };

let ip = 0;
const post = (body: unknown) => {
  ip += 1;
  return POST(
    new NextRequest("https://site.test/api/checkout-session", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "x-real-ip": `10.0.0.${ip}` },
    }),
  );
};

describe("Stripe 결제 세션 API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("테스트 키가 없으면 꺼진 것으로 답해, 화면이 내장 테스트 결제를 씁니다", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const response = await post({ ...order, expectedTotal: 13300 });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "disabled" });
  });

  describe("테스트 키가 있으면", () => {
    it("세션을 만들어 Stripe 결제 화면 주소를 돌려줍니다(MSW 목업)", async () => {
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_msw_mock");
      const result = await (await post({ ...order, expectedTotal: 13300 })).json();
      expect(result).toMatchObject({ status: "created" });
      expect(result.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
      expect(result.id).toMatch(/^cs_test_/);
    });

    it("Stripe가 끊기면 502로 답해, 화면이 내장 테스트 결제로 바꿉니다", async () => {
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_msw_mock");
      server.use(...outageHandlers);
      const response = await post({ ...order, expectedTotal: 13300 });
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ status: "error" });
    });

    it("금액이 카탈로그와 다르면 409, 형식이 틀리면 400입니다", async () => {
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_msw_mock");
      expect((await post({ ...order, expectedTotal: 1 })).status).toBe(409);
      expect((await post({ items: [] })).status).toBe(400);
    });
  });
});
