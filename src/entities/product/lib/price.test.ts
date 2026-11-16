import { describe, expect, it } from "vitest";

import { LOCALES } from "@/shared/i18n/index.server";

import { PRODUCTS } from "../model/catalog";
import { COUNTRY_NAMES } from "./country-names";
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
    // 긴 이름이 실행 환경마다 다른 홍콩은 짧은 이름입니다(서버·브라우저가 같은 글자를 그려야 함).
    expect(countryName("HK", "en")).toBe("Hong Kong");
    expect(countryName("HK", "ko")).toBe("홍콩");
  });

  it("모든 상품의 나라 이름이 10개 언어 표에 있습니다", () => {
    const codes = new Set(PRODUCTS.map(({ country }) => country).filter((code) => code !== "XX"));
    for (const locale of LOCALES) {
      for (const code of codes) {
        expect(COUNTRY_NAMES[locale]?.[code], `${locale}:${code}`).toBeTruthy();
      }
    }
  });
});
