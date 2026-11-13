import { defineRouting } from "next-intl/routing";

export const LOCALES = ["ko", "en", "ja", "zh", "fr", "it", "es", "de", "pt", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

/** 언어 선택 메뉴에 각 언어의 자기 이름으로 표시합니다. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "简体中文",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
  tr: "Türkçe",
};

/**
 * 언어 메뉴에 붙이는 국기의 나라(ISO 3166-1). 언어와 나라가 1:1은 아니므로 이렇게 골랐습니다.
 * 영어는 번역이 미국식 표기라 미국, 포르투갈어는 카탈로그의 포르투갈 디저트에 맞춰 포르투갈입니다.
 */
export const LOCALE_COUNTRIES = {
  ko: "KR",
  en: "US",
  ja: "JP",
  zh: "CN",
  fr: "FR",
  it: "IT",
  es: "ES",
  de: "DE",
  pt: "PT",
  tr: "TR",
} as const satisfies Record<Locale, string>;

/** 언어 메뉴에 국기와 함께 쓰는 나라 이름. 각 나라의 말로 적습니다. */
export const LOCALE_COUNTRY_NAMES: Record<Locale, string> = {
  ko: "대한민국",
  en: "United States",
  ja: "日本",
  zh: "中国",
  fr: "France",
  it: "Italia",
  es: "España",
  de: "Deutschland",
  pt: "Portugal",
  tr: "Türkiye",
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});
