"use client";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import { settleStripeOrdersAtom } from "@/entities/order";
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
  const settle = useSetAtom(settleStripeOrdersAtom);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // 장바구니 주문이면 서버가 세션에서 읽은 상품, 바로 구매면 빈 목록입니다.
  const purchased = order?.purchased.join(",") ?? "";
  const sessionId = order?.sessionId;

  useEffect(() => {
    headingRef.current?.focus();
    // 결제 전에 저장한 수량만큼 장바구니에서 빼고, 다음 방문 때 다시 반영하지 않게 표시합니다.
    if (sessionId) {
      settle([{ sessionId, paid: true, purchased: purchased ? purchased.split(",") : [] }]);
    }
  }, [purchased, sessionId, settle]);

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
