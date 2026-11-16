import { describe, expect, it } from "vitest";

import { productJsonLd } from "./json-ld";

describe("productJsonLd", () => {
  it("이름·사진·가격·통화를 schema.org Product로 만들고, 태그를 닫는 글자를 이스케이프합니다", () => {
    const text = productJsonLd({
      slug: "baklava",
      locale: "ko",
      name: "바클라바</script><script>alert(1)</script>",
      description: "꿀과 견과",
      image: "/images/products/baklava.webp",
      price: 9800,
      currency: "KRW",
    });
    expect(text).not.toContain("</script>");
    const data = JSON.parse(text);
    expect(data).toMatchObject({
      "@type": "Product",
      name: "바클라바</script><script>alert(1)</script>",
      sku: "baklava",
      offers: { "@type": "Offer", price: 9800, priceCurrency: "KRW" },
    });
    expect(data.image[0]).toMatch(/^https?:\/\/.+\/images\/products\/baklava\.webp$/);
    expect(data.offers.url).toMatch(/\/ko\/shop\/baklava$/);
  });
});
