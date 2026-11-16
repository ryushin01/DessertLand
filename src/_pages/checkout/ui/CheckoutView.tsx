"use client";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "styled-system/css";

import { MAX_ORDER_LINES, cartLinesAtom, removePurchased, type CartLine } from "@/entities/cart";
import { addSavedOrder, savedOrdersAtom } from "@/entities/order";
import { formatMoney } from "@/entities/product";
import { summarizeCart } from "@/entities/cart";
import { useCartSummary } from "@/features/cart-summary";
import { CheckoutForm, type PaidOrder } from "./CheckoutForm";
import { StripeCheckoutButton } from "@/features/stripe-checkout";
import { Link } from "@/shared/i18n";
import { Icon, buttonRecipe, pageShell, pageTitle } from "@/shared/ui";

const demo = css({
  padding: "14px 16px",
  borderRadius: "12px",
  background: "cocoa.800",
  marginBlockEnd: "32px",
  lineHeight: "1.5",
});
const buyNowNote = css({ marginBlockEnd: "24px", color: "caramel" });
const successActions = css({ display: "flex", flexWrap: "wrap", gap: "12px" });
const limitNotice = css({
  padding: "14px 16px",
  border: "2px solid {colors.strawberry}",
  borderRadius: "12px",
  lineHeight: "1.5",
});
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
  const tOrders = useTranslations("orders");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const cartSummary = useCartSummary();
  const setCart = useSetAtom(cartLinesAtom);
  const setSavedOrders = useSetAtom(savedOrdersAtom);
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
    // 내장 테스트 결제는 서버에 남지 않으므로, 주문 내역에 보일 정보를 이 브라우저에 남깁니다.
    setSavedOrders((orders) =>
      addSavedOrder(orders, {
        kind: "demo",
        orderNo: paid.orderNo,
        createdAt: Date.now(),
        total: paid.total,
        locale,
        items,
      }),
    );
    // 바로 구매는 장바구니를 건드리지 않고, 장바구니 주문은 고른 상품만 뺍니다.
    if (!buyNow)
      setCart((lines) =>
        removePurchased(
          lines,
          items.map((item) => item.slug),
        ),
      );
  };

  if (order) {
    return (
      <div className={pageShell}>
        <h1 ref={successRef} tabIndex={-1} className={pageTitle}>
          {t("successTitle")}
        </h1>
        <div className={demo}>
          <p>{t("successBody", { orderNo: order.orderNo })}</p>
          <p>{t("paidAmount", { amount: formatMoney(order.total, locale) })}</p>
          <p>{t("paidMethod", { method: t(METHOD_LABELS[order.method]) })}</p>
        </div>
        <p className={successActions}>
          <Link href="/shop" className={buttonRecipe()}>
            {t("continue")}
            <Icon name="arrow-right" />
          </Link>
          <Link href="/orders" className={buttonRecipe({ tone: "outline" })}>
            {tOrders("link")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <h1 className={pageTitle}>{t("title")}</h1>
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
          {items.length > MAX_ORDER_LINES ? (
            // Stripe 결제 항목 상한 때문에 서버가 거절하므로, 결제를 시작하기 전에 알립니다.
            <p className={limitNotice}>
              {t("tooManyItems", { max: MAX_ORDER_LINES, count: items.length })}
            </p>
          ) : stripeEnabled ? (
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
