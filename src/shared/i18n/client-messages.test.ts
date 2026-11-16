import { describe, expect, it } from "vitest";

import messages from "./messages/ko.json";
import { pickClientMessages } from "./client-messages";

describe("pickClientMessages", () => {
  const picked = pickClientMessages(messages);

  it("상품은 이름만 남기고 설명은 빼며, 서버 전용 묶음은 보내지 않습니다", () => {
    expect(picked.products).toMatchObject({ tiramisu: { name: messages.products.tiramisu.name } });
    expect(JSON.stringify(picked.products)).not.toContain(messages.products.tiramisu.description);
    expect(Object.keys(picked)).not.toEqual(expect.arrayContaining(["meta"]));
    expect(picked).not.toHaveProperty("footer");
    expect(picked).not.toHaveProperty("notFound");
    expect(picked.cart).toEqual(messages.cart);
  });

  it("상품 설명 전체만큼 보내는 양이 줄어듭니다", () => {
    const descriptions = Object.values(messages.products)
      .map(({ description }) => description)
      .join("");
    const saved = JSON.stringify(messages).length - JSON.stringify(picked).length;
    expect(saved).toBeGreaterThan(descriptions.length);
  });
});
