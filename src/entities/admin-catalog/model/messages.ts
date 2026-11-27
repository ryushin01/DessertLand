"use client";

import { useEffect, useState } from "react";

import { z } from "zod";

import { loadHttp } from "@/shared/api";

import type { AdminLocale } from "./schema";

type ProductTexts = Record<string, { name: string; description: string }>;
const textsSchema = z.object({
  products: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
});

/**
 * 언어별 상품 이름·설명 원문(메시지 파일). 서버(`GET /api/admin/product-texts`)가 고른 언어만 보내,
 * 10개 언어 메시지를 어드민 번들에 싣지 않습니다. 같은 출처라 오프라인에서도 읽힙니다. 같은 언어는 한 번만 받습니다.
 */
const cache = new Map<AdminLocale, Promise<ProductTexts>>();

export function loadProductTexts(locale: AdminLocale): Promise<ProductTexts> {
  let pending = cache.get(locale);
  if (!pending) {
    pending = (async () => {
      const { http } = await loadHttp();
      const body: unknown = await http
        .url(`/api/admin/product-texts?locale=${locale}`)
        .get()
        .json();
      return textsSchema.parse(body).products;
    })();
    // 실패하면 다음에 다시 받습니다.
    pending.catch(() => cache.delete(locale));
    cache.set(locale, pending);
  }
  return pending;
}

/** 고른 언어의 상품 문구. 받기 전에는 null입니다. */
export function useProductTexts(locale: AdminLocale): ProductTexts | null {
  const [texts, setTexts] = useState<{ locale: AdminLocale; value: ProductTexts } | null>(null);
  useEffect(() => {
    let alive = true;
    loadProductTexts(locale)
      .then((value) => {
        if (alive) setTexts({ locale, value });
      })
      .catch(() => {
        // 받지 못하면 slug로 보여 줍니다.
      });
    return () => {
      alive = false;
    };
  }, [locale]);
  return texts?.locale === locale ? texts.value : null;
}
