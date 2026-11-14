"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { css } from "styled-system/css";

import type { CartLine } from "@/entities/cart";
import { formatMoney } from "@/entities/product";
import {
  PAYMENT_METHODS,
  requestPayment,
  type PaymentMethod,
  type TestOutcome,
} from "@/features/pay-order";
import { Button } from "@/shared/ui";

import { TestPaymentDialog } from "./TestPaymentDialog";
import { validateCheckout, type CheckoutData, type CheckoutErrors } from "../model/validate";

const form = css({ display: "grid", gap: "20px" });
const field = css({ display: "grid", gap: "8px" });
const label = css({ fontSize: "0.9rem", fontWeight: "500" });
const input = css({
  width: "100%",
  minHeight: "52px",
  paddingInline: "16px",
  borderRadius: "12px",
  background: "cocoa.900",
  border: "1px solid {colors.muted}",
  color: "cream",
  "&[aria-invalid=true]": { borderColor: "strawberry", borderWidth: "2px" },
});
const errorText = css({ color: "strawberry", fontSize: "0.875rem" });
const messageBox = css({
  padding: "14px 16px",
  border: "2px solid {colors.strawberry}",
  borderRadius: "12px",
  lineHeight: "1.5",
});
const fieldset = css({ display: "grid", gap: "8px" });
const legend = css({ fontSize: "0.9rem", fontWeight: "500", marginBlockEnd: "8px" });
const methodOption = css({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minHeight: "52px",
  paddingInline: "16px",
  borderRadius: "12px",
  border: "1px solid {colors.muted}",
  background: "cocoa.900",
  cursor: "pointer",
  _hover: { background: "cocoa.800" },
  "&:has(input:checked)": { borderColor: "caramel", borderWidth: "2px" },
  "& input": { width: "20px", height: "20px", accentColor: "#f2b267" },
});

const FIELDS = [
  { name: "name", type: "text", autoComplete: "name" },
  { name: "email", type: "email", autoComplete: "email" },
  { name: "address", type: "text", autoComplete: "street-address" },
] as const;

const METHOD_LABELS = { card: "methodCard", wallet: "methodWallet", bank: "methodBank" } as const;

type Notice = "declined" | "canceled" | "paymentError" | "amountChanged";

export type PaidOrder = { orderNo: string; total: number; method: PaymentMethod };

type CheckoutFormProps = {
  items: CartLine[];
  total: number;
  onPaid: (order: PaidOrder) => void;
};

export function CheckoutForm({ items, total, onPaid }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const payButtonRef = useRef<HTMLButtonElement>(null);
  const amount = formatMoney(total, locale);

  // 버튼이 다시 활성화된 뒤에 초점을 돌려줘야 키보드 사용자가 바로 재시도할 수 있습니다.
  useEffect(() => {
    if (!pending && notice) payButtonRef.current?.focus();
  }, [pending, notice]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingRef.current) return;
    const values = new FormData(event.currentTarget);
    const data: CheckoutData = {
      name: String(values.get("name") ?? ""),
      email: String(values.get("email") ?? ""),
      address: String(values.get("address") ?? ""),
    };
    const nextErrors = validateCheckout(data);
    setErrors(nextErrors);
    setNotice(null);
    const firstInvalid = FIELDS.find(({ name }) => nextErrors[name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name=${firstInvalid.name}]`)?.focus();
      return;
    }
    setDialogOpen(true);
  };

  const pay = async (outcome: TestOutcome) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      const result = await requestPayment({ items, method, locale, expectedTotal: total, outcome });
      if (result.status === "approved") {
        onPaid({ orderNo: result.orderNo, total: result.total, method });
        return;
      }
      if (result.status === "declined") setNotice("declined");
      else if (result.status === "amount_mismatch") setNotice("amountChanged");
      else setNotice("paymentError");
    } catch {
      setNotice("paymentError");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  const resolveDialog = (outcome: TestOutcome | "cancel") => {
    setDialogOpen(false);
    if (outcome === "cancel") {
      setNotice("canceled");
      return;
    }
    void pay(outcome);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form ref={formRef} className={form} onSubmit={submit} noValidate>
      {hasErrors ? (
        <p role="alert" className={messageBox}>
          {t("errorSummary")}
        </p>
      ) : null}
      {FIELDS.map(({ name, type, autoComplete }) => {
        const error = errors[name];
        const errorId = `checkout-${name}-error`;
        return (
          <div key={name} className={field}>
            <label className={label} htmlFor={`checkout-${name}`}>
              {t(name)}
            </label>
            <input
              id={`checkout-${name}`}
              name={name}
              type={type}
              autoComplete={autoComplete}
              required
              className={input}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
            {error ? (
              <p id={errorId} className={errorText}>
                {t(error)}
              </p>
            ) : null}
          </div>
        );
      })}
      <fieldset className={fieldset}>
        <legend className={legend}>{t("paymentLegend")}</legend>
        {PAYMENT_METHODS.map((option) => (
          <label key={option} className={methodOption}>
            <input
              type="radio"
              name="method"
              value={option}
              checked={method === option}
              onChange={() => setMethod(option)}
            />
            {t(METHOD_LABELS[option])}
          </label>
        ))}
      </fieldset>
      {notice ? (
        <p role="alert" className={messageBox}>
          {t(notice)}
        </p>
      ) : null}
      <Button ref={payButtonRef} type="submit" disabled={pending} aria-busy={pending}>
        {pending ? t("paying") : t("pay", { amount })}
      </Button>
      <TestPaymentDialog amount={dialogOpen ? amount : null} onResolve={resolveDialog} />
    </form>
  );
}
