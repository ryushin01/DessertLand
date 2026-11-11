"use client";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "styled-system/css";

import { cartLinesAtom, type CartLine } from "@/entities/cart";
import { formatMoney } from "@/entities/product";
import { summarizeCart, useCartSummary } from "@/features/cart-summary";
import { CheckoutForm, type PaidOrder } from "@/features/checkout-form";
import { StripeCheckoutButton } from "@/features/stripe-checkout";
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
const buyNowNote = css({ marginBlockEnd: "24px", color: "caramel" });
const columns = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "minmax(0, 3fr) minmax(0, 2fr)" },
  gap: "40px",
  alignItems: "start",
});
const summaryTitle = css({ fontFamily: "display", fontSize: "2rem", marginBlockEnd: "14px" });
const row = css({
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  paddingBlock: "8px",
});
const total = css({
  display: "flex",
  justifyContent: "space-between",
  paddingBlockStart: "14px",
  marginBlockStart: "8px",
  borderBlockStart: "1px solid {colors.cocoa.700}",
  fontSize: "1.25rem",
  fontWeight: "600",
});

const METHOD_LABELS = { card: "methodCard", wallet: "methodWallet", bank: "methodBank" } as const;

type CheckoutViewProps = { buyNow?: CartLine; stripeEnabled: boolean; canceled: boolean };

export function CheckoutView({ buyNow, stripeEnabled, canceled }: CheckoutViewProps) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const cartSummary = useCartSummary();
  const setCart = useSetAtom(cartLinesAtom);
  const buyNowSummary = useMemo(
    () => (buyNow ? summarizeCart([buyNow], locale) : null),
    [buyNow, locale],
  );
  const summary = buyNowSummary ?? cartSummary;
  const items = summary.lines.map(({ product, quantity }) => ({ slug: product.slug, quantity }));
  const [order, setOrder] = useState<PaidOrder | null>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (order) successRef.current?.focus();
  }, [order]);

  const onPaid = (paid: PaidOrder) => {
    setOrder(paid);
    // 바로 구매는 장바구니를 건드리지 않습니다.
    if (!buyNow) setCart([]);
  };

  if (order) {
    return (
      <div className={page}>
        <h1 ref={successRef} tabIndex={-1} className={title}>
          {t("successTitle")}
        </h1>
        <div className={demo}>
          <p>{t("successBody", { orderNo: order.orderNo })}</p>
          <p>{t("paidAmount", { amount: formatMoney(order.total, locale) })}</p>
          <p>{t("paidMethod", { method: t(METHOD_LABELS[order.method]) })}</p>
        </div>
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
      <p className={demo}>{stripeEnabled ? t("stripeNotice") : t("demo")}</p>
      {buyNow ? <p className={buyNowNote}>{t("buyNowNotice")}</p> : null}
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
          {stripeEnabled ? (
            <StripeCheckoutButton
              items={items}
              total={summary.total}
              source={buyNow ? "buy" : "cart"}
              canceled={canceled}
            />
          ) : (
            <CheckoutForm items={items} total={summary.total} onPaid={onPaid} />
          )}
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className={summaryTitle}>
              {t("summary")}
            </h2>
            <ul>
              {summary.lines.map(({ product, quantity, lineTotal }) => (
                <li key={product.slug} className={row}>
                  <span>
                    {tProducts(`${product.slug}.name` as Parameters<typeof tProducts>[0]) as string}{" "}
                    × {quantity}
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
