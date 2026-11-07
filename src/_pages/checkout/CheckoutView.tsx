"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import { formatMoney } from "@/entities/product";
import { useCartSummary } from "@/features/cart-summary";
import { CheckoutForm } from "@/features/checkout-form";
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
const demo = css({
  padding: "14px 16px",
  borderRadius: "12px",
  background: "cocoa.800",
  marginBlockEnd: "32px",
  lineHeight: "1.5",
});
const columns = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "minmax(0, 3fr) minmax(0, 2fr)" },
  gap: "40px",
  alignItems: "start",
});
const summaryTitle = css({ fontFamily: "display", fontSize: "2rem", marginBlockEnd: "14px" });
const row = css({ display: "flex", justifyContent: "space-between", gap: "16px", paddingBlock: "8px" });
const total = css({
  display: "flex",
  justifyContent: "space-between",
  paddingBlockStart: "14px",
  marginBlockStart: "8px",
  borderBlockStart: "1px solid {colors.cocoa.700}",
  fontSize: "1.25rem",
  fontWeight: "600",
});

export function CheckoutView() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const summary = useCartSummary();
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (orderNo) successRef.current?.focus();
  }, [orderNo]);

  if (orderNo) {
    return (
      <div className={page}>
        <h1 ref={successRef} tabIndex={-1} className={title}>
          {t("successTitle")}
        </h1>
        <p className={demo}>{t("successBody", { orderNo })}</p>
        <Link href="/shop" className={buttonRecipe()}>
          {t("continue")}
          <Icon name="arrow-right" />
        </Link>
      </div>
    );
  }

  return (
    <div className={page}>
      <h1 className={title}>{t("title")}</h1>
      <p className={demo}>{t("demo")}</p>
      {summary.lines.length === 0 ? (
        <>
          <p className={css({ marginBlockEnd: "20px" })}>{t("empty")}</p>
          <Link href="/shop" className={buttonRecipe()}>
            {t("continue")}
            <Icon name="arrow-right" />
          </Link>
        </>
      ) : (
        <div className={columns}>
          <CheckoutForm onComplete={setOrderNo} />
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className={summaryTitle}>
              {t("summary")}
            </h2>
            <ul>
              {summary.lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.slug} className={row}>
                  <span>
                    {tProducts(`${product.slug}.name` as Parameters<typeof tProducts>[0]) as string} ×{" "}
                    {quantity}
                  </span>
                  <span>{formatMoney(lineTotal, locale)}</span>
                </li>
              ))}
            </ul>
            <p className={row}>
              <span>{tCart("shipping")}</span>
              <span>{formatMoney(summary.shipping, locale)}</span>
            </p>
            <p className={total}>
              <span>{tCart("total")}</span>
              <span>{formatMoney(summary.total, locale)}</span>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
