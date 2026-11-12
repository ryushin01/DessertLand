"use client";

import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";
import { useMemo } from "react";

import { cartLinesAtom, selectedCartLinesAtom } from "@/entities/cart";

import { summarizeCart } from "./summarize";

/**
 * 장바구니 요약. 기본은 주문할(고른) 상품만, scope가 "all"이면 담은 상품 전체를 계산합니다.
 */
export function useCartSummary(scope: "selected" | "all" = "selected") {
  const all = useAtomValue(cartLinesAtom);
  const selected = useAtomValue(selectedCartLinesAtom);
  const lines = scope === "all" ? all : selected;
  const locale = useLocale();
  return useMemo(() => summarizeCart(lines, locale), [lines, locale]);
}
