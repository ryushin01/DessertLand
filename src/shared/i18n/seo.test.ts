import { describe, expect, it } from "vitest";

import { LOCALES } from "./routing";
import { localeAlternates, siteOpenGraph } from "./seo";

describe("localeAlternates", () => {
  it("모든 언어와 기본 주소를 알립니다", () => {
    const alternates = localeAlternates("ja", "/shop");
    const languages = alternates?.languages as Record<string, string>;
    expect(alternates?.canonical).toMatch(/\/ja\/shop$/);
    expect(Object.keys(languages)).toHaveLength(LOCALES.length + 1);
    expect(languages["x-default"]).toMatch(/\/ko\/shop$/);
  });
});

describe("siteOpenGraph", () => {
  it("공유 이미지를 포함합니다", () => {
    expect(siteOpenGraph("제목", "설명")).toMatchObject({
      title: "제목",
      description: "설명",
      images: [{ url: "/og-image.jpg" }],
    });
  });
});
