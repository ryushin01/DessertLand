import { describe, expect, it } from "vitest";

import { countryName, currencyForLocale, formatProductPrice, priceInCurrency } from "./price";

describe("price", () => {
  it("언어에 맞는 통화를 고릅니다", () => {
    expect(currencyForLocale("ko")).toBe("KRW");
    expect(currencyForLocale("de")).toBe("EUR");
    expect(currencyForLocale("tr")).toBe("TRY");
    expect(currencyForLocale("xx")).toBe("USD");
  });

  it("통화별 단위로 반올림합니다", () => {
    expect(priceInCurrency(9.5, "KRW")).toBe(13300);
    expect(priceInCurrency(3.5, "JPY")).toBe(530);
  });

  it("언어 형식으로 가격을 표시합니다", () => {
    expect(formatProductPrice(9.5, "ko")).toContain("13,300");
    expect(formatProductPrice(9.5, "en")).toBe("$9.50");
  });

  it("국가 이름을 언어별로 표시합니다", () => {
    expect(countryName("JP", "ko")).toBe("일본");
    expect(countryName("JP", "en")).toBe("Japan");
  });
});
