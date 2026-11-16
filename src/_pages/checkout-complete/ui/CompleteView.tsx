"use client";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import { cartLinesAtom, removePurchased } from "@/entities/cart";
import { savedOrdersAtom, settleOrders } from "@/entities/order";
import { formatMoney } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { Icon, buttonRecipe, pageShell, pageTitle } from "@/shared/ui";

const actions = css({ display: "flex", flexWrap: "wrap", gap: "12px" });
const box = css({
  padding: "14px 16px",
  borderRadius: "12px",
  background: "cocoa.800",
  marginBlockEnd: "32px",
  lineHeight: "1.5",
});

type CompleteViewProps = {
  order: { orderNo: string; total: number; purchased: string[]; sessionId: string } | null;
};

export function CompleteView({ order }: CompleteViewProps) {
  const t = useTranslations("checkout");
  const tOrders = useTranslations("orders");
  const locale = useLocale();
  const setCart = useSetAtom(cartLinesAtom);
  const setSavedOrders = useSetAtom(savedOrdersAtom);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // 장바구니에서 고른 상품만 결제했으므로 그 상품만 뺍니다.
  const purchased = order?.purchased.join(",") ?? "";
  const sessionId = order?.sessionId;

  useEffect(() => {
    headingRef.current?.focus();
    if (purchased) setCart((lines) => removePurchased(lines, purchased.split(",")));
    // 결과를 여기서 반영했으므로, 다음 방문 때 다시 반영하지 않게 표시합니다.
    if (sessionId) setSavedOrders((orders) => settleOrders(orders, [sessionId]));
  }, [purchased, sessionId, setCart, setSavedOrders]);

  return (
    <div className={pageShell}>
      <h1 ref={headingRef} tabIndex={-1} className={pageTitle}>
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
      <p className={actions}>
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
