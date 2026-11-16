"use client";

import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import type { CartLine } from "@/entities/cart";
import { addSavedOrder, updateSavedOrdersAtom } from "@/entities/order";
import { formatMoney } from "@/entities/product";
import { Button } from "@/shared/ui";

import type { OrderSource } from "../api/build-session";
import { isSessionId } from "../model/order-lookup";

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
  // 주문 목록을 구독하지 않는 버튼이라, 저장소의 최신 목록 위에 더하는 갱신 atom을 씁니다.
  const updateSavedOrders = useSetAtom(updateSavedOrdersAtom);

  // Stripe 화면에서 브라우저 뒤로 가기로 돌아오면 이전 상태가 복원되므로 버튼을 다시 켭니다.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      pendingRef.current = false;
      setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

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
      const result = (await response.json()) as { status?: unknown; url?: unknown; id?: unknown };
      // 결제 창 주소는 https일 때만 엽니다. 응답이 어긋나도 엉뚱한 곳으로 보내지 않습니다.
      if (result.status === "created" && typeof result.url === "string" && result.url.startsWith("https://")) {
        // 결제 뒤 완료 화면으로 돌아오지 못해도 다음 방문 때 결과를 반영하도록, 세션 ID만 기억합니다.
        if (isSessionId(result.id)) {
          const sessionId = result.id;
          updateSavedOrders((orders) =>
            addSavedOrder(orders, {
              kind: "stripe",
              sessionId,
              createdAt: Date.now(),
              source,
              settled: false,
            }),
          );
        }
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
