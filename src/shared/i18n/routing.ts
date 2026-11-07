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

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});
