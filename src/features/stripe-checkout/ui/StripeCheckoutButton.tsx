"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { css } from "styled-system/css";

import type { CartLine } from "@/entities/cart";
import { formatMoney } from "@/entities/product";
import { Button } from "@/shared/ui";

import type { OrderSource } from "../api/build-session";

const root = css({ display: "grid", gap: "16px" });
const messageBox = css({
  padding: "14px 16px",
  border: "2px solid {colors.strawberry}",
  borderRadius: "12px",
  lineHeight: "1.5",
});

type Notice = "paymentError" | "amountChanged" | "canceled";

type StripeCheckoutButtonProps = {
  items: CartLine[];
  total: number;
  source: OrderSource;
  canceled: boolean;
};

/** Stripe의 결제 화면으로 이동합니다. 카드와 배송 정보는 Stripe 화면에서만 입력합니다. */
export function StripeCheckoutButton({
  items,
  total,
  source,
  canceled,
}: StripeCheckoutButtonProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [notice, setNotice] = useState<Notice | null>(canceled ? "canceled" : null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const start = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items, locale, expectedTotal: total, source }),
      });
      const result = (await response.json()) as { status: string; url?: string };
      if (result.status === "created" && result.url) {
        window.location.assign(result.url);
        return;
      }
      setNotice(result.status === "amount_mismatch" ? "amountChanged" : "paymentError");
    } catch {
      setNotice("paymentError");
    }
    pendingRef.current = false;
    setPending(false);
  };

  return (
    <div className={root}>
      {notice ? (
        <p role="alert" className={messageBox}>
          {t(notice)}
        </p>
      ) : null}
      <Button onClick={start} disabled={pending} aria-busy={pending}>
        {pending ? t("stripeRedirecting") : t("stripePay", { amount: formatMoney(total, locale) })}
      </Button>
    </div>
  );
}
