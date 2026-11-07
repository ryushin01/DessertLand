"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import type { TestOutcome } from "@/features/pay-order";
import { getLenis } from "@/shared/lib/motion";
import { Button } from "@/shared/ui";

const dialog = css({
  margin: "auto",
  width: "min(460px, calc(100vw - 32px))",
  padding: "28px",
  borderRadius: "20px",
  background: "cocoa.900",
  color: "cream",
  border: "1px solid {colors.cocoa.700}",
  "&::backdrop": { background: "rgba(10, 6, 5, 0.72)", backdropFilter: "blur(6px)" },
});
const title = css({ fontFamily: "display", fontSize: "2rem", marginBlockEnd: "12px" });
const body = css({ lineHeight: "1.55", marginBlockEnd: "22px" });
const actions = css({ display: "grid", gap: "10px" });

type TestPaymentDialogProps = {
  amount: string | null;
  onResolve: (outcome: TestOutcome | "cancel") => void;
};

/** 실제 PG 결제창 자리에 쓰는 테스트 결제창입니다. 결제 정보를 입력받지 않습니다. */
export function TestPaymentDialog({ amount, onResolve }: TestPaymentDialogProps) {
  const t = useTranslations("checkout");
  const ref = useRef<HTMLDialogElement>(null);
  const open = amount !== null;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      getLenis()?.stop();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  // 뒤로 가기처럼 열린 채로 사라지면 close 이벤트가 없으므로, 여기서 스크롤을 되살립니다.
  useEffect(() => () => void getLenis()?.start(), []);

  return (
    <dialog
      ref={ref}
      className={dialog}
      aria-labelledby="test-payment-title"
      onClose={() => getLenis()?.start()}
      onCancel={(event) => {
        event.preventDefault();
        onResolve("cancel");
      }}
    >
      <h2 id="test-payment-title" className={title}>
        {t("testTitle")}
      </h2>
      <p className={body}>{amount ? t("testBody", { amount }) : null}</p>
      <div className={actions}>
        <Button onClick={() => onResolve("approve")}>{t("testApprove")}</Button>
        <Button tone="outline" onClick={() => onResolve("decline")}>
          {t("testDecline")}
        </Button>
        <Button tone="outline" onClick={() => onResolve("cancel")}>
          {t("testCancel")}
        </Button>
      </div>
    </dialog>
  );
}
