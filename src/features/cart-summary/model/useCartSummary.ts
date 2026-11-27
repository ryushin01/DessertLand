"use client";

import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";
import { useMemo } from "react";

import { cartLinesAtom, selectedCartLinesAtom, summarizeCart } from "@/entities/cart";
import { useCatalogOverrides } from "@/entities/product";

/**
 * 장바구니 요약. 기본은 주문할(고른) 상품만, scope가 "all"이면 담은 상품 전체를 계산합니다.
 */
export function useCartSummary(scope: "selected" | "all" = "selected") {
  const all = useAtomValue(cartLinesAtom);
  const selected = useAtomValue(selectedCartLinesAtom);
  const lines = scope === "all" ? all : selected;
  const locale = useLocale();
  // 공개 데모에서는 어드민이 고친 가격·숨김을 반영합니다(데모가 꺼지면 늘 빈 값).
  const overrides = useCatalogOverrides();
  return useMemo(() => summarizeCart(lines, locale, overrides), [lines, locale, overrides]);
}
