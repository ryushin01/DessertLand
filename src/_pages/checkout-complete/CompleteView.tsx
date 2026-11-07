"use client";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import { cartLinesAtom } from "@/entities/cart";
import { formatMoney } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { Icon, buttonRecipe } from "@/shared/ui";

const page = css({
  minHeight: "100svh",
  paddingBlock: "110px 72px",
  paddingInline: { base: "16px", md: "28px" },
  maxWidth: "1200px",
  marginInline: "auto",
});
const title = css({
  fontFamily: "display",
  fontSize: "clamp(3rem, 8vw, 7rem)",
  lineHeight: "1",
  marginBlockEnd: "20px",
  wordBreak: "var(--word-break)",
});
const box = css({
  padding: "14px 16px",
  borderRadius: "12px",
  background: "cocoa.800",
  marginBlockEnd: "32px",
  lineHeight: "1.5",
});

type CompleteViewProps = {
  order: { orderNo: string; total: number; clearCart: boolean } | null;
};

export function CompleteView({ order }: CompleteViewProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const setCart = useSetAtom(cartLinesAtom);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clearCart = order?.clearCart ?? false;

  useEffect(() => {
    headingRef.current?.focus();
    if (clearCart) setCart([]);
  }, [clearCart, setCart]);

  return (
    <div className={page}>
      <h1 ref={headingRef} tabIndex={-1} className={title}>
        {order ? t("successTitle") : t("paymentError")}
      </h1>
      <div className={box}>
        {order ? (
          <>
            <p>{t("successBody", { orderNo: order.orderNo })}</p>
            <p>{t("paidAmount", { amount: formatMoney(order.total, locale) })}</p>
          </>
        ) : (
          <p>{t("unverified")}</p>
        )}
      </div>
      <Link href="/shop" className={buttonRecipe()}>
        {t("continue")}
        <Icon name="arrow-right" />
      </Link>
    </div>
  );
}
