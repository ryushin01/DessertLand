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
  overflow: "hidden",
  borderRadius: "20px",
  background: "cocoa.900",
  color: "cream",
  border: "1px solid {colors.cocoa.700}",
  "&::backdrop": { background: "rgba(10, 6, 5, 0.72)", backdropFilter: "blur(6px)" },
});
const content = css({
  maxHeight: "calc(100dvh - 32px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "28px",
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

  // 열려 있는 동안만 스크롤을 멈춥니다. 뒤로 가기로 사라질 때도 이 정리 함수가 스크롤을 되살립니다.
  useEffect(() => {
    const element = ref.current;
    if (!open || !element) return;
    element.showModal();
    getLenis()?.stop();
    return () => {
      element.close();
      getLenis()?.start();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={dialog}
      aria-labelledby="test-payment-title"
      onCancel={(event) => {
        event.preventDefault();
        onResolve("cancel");
      }}
    >
      <div className={content} data-lenis-prevent>
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
      </div>
    </dialog>
  );
}
