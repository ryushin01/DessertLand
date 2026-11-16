"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";

import { orderKey, useSavedOrders, type SavedOrder } from "@/entities/order";
import { currencyForLocale, formatCurrency } from "@/entities/product";
import { lookupOrders, type StripeOrderLookup } from "@/features/stripe-checkout";
import { Link } from "@/shared/i18n";
import { Icon, buttonRecipe, pageShell, pageTitle } from "@/shared/ui";

const lede = css({
  maxWidth: "40rem",
  lineHeight: "1.6",
  marginBlockEnd: "32px",
  wordBreak: "var(--word-break)",
});
const list = css({ display: "grid", gap: "16px", marginBlockEnd: "32px" });
const card = css({
  display: "grid",
  gap: "12px",
  padding: "18px 20px",
  borderRadius: "12px",
  background: "cocoa.800",
});
const cardHead = css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px" });
const cardTitle = css({ fontFamily: "display", fontSize: "1.6rem", lineHeight: "1.2" });
const badge = css({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  background: "cocoa.950",
  fontSize: "0.8rem",
});
const facts = css({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "6px 20px",
  fontSize: "0.95rem",
  "& dt": { color: "muted" },
});
const statusText = css({ marginBlockEnd: "20px" });

type Row = {
  key: string;
  orderNo?: string;
  createdAt: number;
  total?: number;
  currency?: string;
  count?: number;
  state: StripeOrderLookup["state"] | "demo";
};

function toRow(order: SavedOrder, lookups: Record<string, StripeOrderLookup> | null): Row {
  if (order.kind === "demo") {
    return {
      key: orderKey(order),
      orderNo: order.orderNo,
      createdAt: order.createdAt,
      total: order.total,
      currency: currencyForLocale(order.locale),
      count: order.items.reduce((sum, item) => sum + item.quantity, 0),
      state: "demo",
    };
  }
  const found = lookups?.[order.sessionId];
  return {
    key: orderKey(order),
    orderNo: found?.orderNo,
    createdAt: found?.createdAt ?? order.createdAt,
    total: found?.total,
    currency: found?.currency,
    state: found?.state ?? "unknown",
  };
}

/** 이 브라우저에 남긴 주문을 보여 줍니다. Stripe 주문은 서버가 Stripe에서 조회한 번호·금액·상태를 씁니다. */
export function OrdersView() {
  const t = useTranslations("orders");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const { orders, loaded } = useSavedOrders();
  // 조회 결과는 어떤 주문들을 물었는지와 함께 둡니다. 목록이 바뀌면 다시 묻는 동안 "불러오는 중"입니다.
  const [result, setResult] = useState<{
    key: string;
    lookups: Record<string, StripeOrderLookup> | null;
  } | null>(null);
  const stripeIds = orders.flatMap((order) => (order.kind === "stripe" ? [order.sessionId] : []));
  const idsKey = stripeIds.join(",");
  // 결과 반영(settled)이 바뀌면 같은 주문들이라도 다시 물어, 결제 중으로 보이던 주문을 새 상태로 바꿉니다.
  const settledKey = orders
    .flatMap((order) => (order.kind === "stripe" && order.settled ? [order.sessionId] : []))
    .join(",");

  useEffect(() => {
    if (!idsKey) return;
    let active = true;
    void lookupOrders(idsKey.split(",")).then((results) => {
      if (!active) return;
      setResult({
        key: idsKey,
        lookups: results ? Object.fromEntries(results.map((item) => [item.sessionId, item])) : null,
      });
    });
    return () => {
      active = false;
    };
  }, [idsKey, settledKey]);

  const current = result?.key === idsKey ? result : null;
  const status = !idsKey ? "idle" : !current ? "loading" : current.lookups ? "idle" : "error";
  const lookups = current?.lookups ?? null;
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const rows = orders.map((order) => toRow(order, lookups));

  return (
    <div className={pageShell}>
      <h1 className={pageTitle}>{t("title")}</h1>
      <p className={lede}>{t("lede")}</p>
      {/* 불러오는 중·실패를 알리는 영역은 처음부터 두고 내용만 바꿉니다. */}
      <p role="status" className={statusText}>
        {status === "loading" ? t("loading") : null}
        {status === "error" ? t("error") : null}
      </p>
      {loaded && rows.length === 0 ? <p className={statusText}>{t("empty")}</p> : null}
      {rows.length > 0 ? (
        <ul className={list}>
          {rows.map((row) => (
            <li key={row.key} className={card}>
              <div className={cardHead}>
                {/* 결제 전·만료 주문은 주문 번호가 없으므로 주문 일시를 제목으로 씁니다. */}
                <h2 className={cardTitle}>{row.orderNo ?? dateFormat.format(row.createdAt)}</h2>
                <span className={badge}>{row.state === "demo" ? t("demo") : t(row.state)}</span>
                {row.count !== undefined ? <span>{t("items", { count: row.count })}</span> : null}
              </div>
              <dl className={facts}>
                {row.orderNo ? (
                  <>
                    <dt>{t("orderNo")}</dt>
                    <dd>{row.orderNo}</dd>
                  </>
                ) : null}
                <dt>{t("date")}</dt>
                <dd>{dateFormat.format(row.createdAt)}</dd>
                {row.total !== undefined && row.currency ? (
                  <>
                    <dt>{t("total")}</dt>
                    <dd>{formatCurrency(row.total, row.currency, locale)}</dd>
                  </>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href="/shop" className={buttonRecipe()}>
        {tCheckout("continue")}
        <Icon name="arrow-right" />
      </Link>
    </div>
  );
}
