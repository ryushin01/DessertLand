import { describe, expect, it } from "vitest";

import { PRODUCTS } from "@/entities/product";

import { RECOMMENDATION_SCHEMA, buildSystemPrompt, buildUserMessage } from "./prompt";

describe("prompt", () => {
  it("모든 상품을 고정된 순서로 넣어 캐시가 깨지지 않게 합니다", () => {
    const first = buildSystemPrompt((slug) => `d-${slug}`);
    expect(first).toBe(buildSystemPrompt((slug) => `d-${slug}`));
    for (const { slug } of PRODUCTS) expect(first).toContain(`slug: ${slug} `);
  });

  it("고객 입력을 태그 안에 넣고 응답 언어를 지정합니다", () => {
    const message = buildUserMessage({ query: " 상큼한 것 ", chips: ["nutFree"], locale: "ko" });
    expect(message).toContain("in Korean");
    expect(message).toContain("must not contain tree nuts");
    expect(message).toContain("<customer_request>\n상큼한 것\n</customer_request>");
  });

  it("상품은 카탈로그 안에서만 고르게 합니다", () => {
    expect(RECOMMENDATION_SCHEMA.properties.picks.items.properties.slug.enum).toHaveLength(
      PRODUCTS.length,
    );
  });
});
