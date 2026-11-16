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

  it("보내는 양이 절반 아래로 줄어듭니다", () => {
    expect(JSON.stringify(picked).length).toBeLessThan(JSON.stringify(messages).length / 2);
  });
});
