"use client";

import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";
import { useMemo } from "react";

import { cartLinesAtom } from "@/entities/cart";

import { summarizeCart } from "./summarize";

export function useCartSummary() {
  const lines = useAtomValue(cartLinesAtom);
  const locale = useLocale();
  return useMemo(() => summarizeCart(lines, locale), [lines, locale]);
}
