"use client";

import { useEffect, useState } from "react";

import type { AdminLocale } from "./schema";

type ProductTexts = Record<string, { name: string; description: string }>;
type MessagesModule = { default: { products: ProductTexts } };

/**
 * 언어별 상품 이름·설명 원문(메시지 파일). 10개 언어를 한 번에 싣지 않도록 고를 때 그 언어만 받습니다.
 * 모두 같은 출처의 빌드 파일이라 오프라인에서도 읽힙니다.
 */
const LOADERS: Record<AdminLocale, () => Promise<MessagesModule>> = {
  ko: () => import("@/shared/i18n/messages/ko.json"),
  en: () => import("@/shared/i18n/messages/en.json"),
  ja: () => import("@/shared/i18n/messages/ja.json"),
  zh: () => import("@/shared/i18n/messages/zh.json"),
  fr: () => import("@/shared/i18n/messages/fr.json"),
  it: () => import("@/shared/i18n/messages/it.json"),
  es: () => import("@/shared/i18n/messages/es.json"),
  de: () => import("@/shared/i18n/messages/de.json"),
  pt: () => import("@/shared/i18n/messages/pt.json"),
  tr: () => import("@/shared/i18n/messages/tr.json"),
};

export async function loadProductTexts(locale: AdminLocale): Promise<ProductTexts> {
  const loaded = await LOADERS[locale]();
  return loaded.default.products;
}

/** 고른 언어의 상품 문구. 받기 전에는 null입니다. */
export function useProductTexts(locale: AdminLocale): ProductTexts | null {
  const [texts, setTexts] = useState<{ locale: AdminLocale; value: ProductTexts } | null>(null);
  useEffect(() => {
    let alive = true;
    void loadProductTexts(locale).then((value) => {
      if (alive) setTexts({ locale, value });
    });
    return () => {
      alive = false;
    };
  }, [locale]);
  return texts?.locale === locale ? texts.value : null;
}
