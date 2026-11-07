"use client";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";
import { css } from "styled-system/css";

import { cartLinesAtom } from "@/entities/cart";
import { Button } from "@/shared/ui";

import { placeDemoOrder, validateCheckout, type CheckoutData, type CheckoutErrors } from "./validate";

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
const summaryBox = css({
  padding: "14px 16px",
  border: "2px solid {colors.strawberry}",
  borderRadius: "12px",
});

const FIELDS = [
  { name: "name", type: "text", autoComplete: "name" },
  { name: "email", type: "email", autoComplete: "email" },
  { name: "address", type: "text", autoComplete: "street-address" },
] as const;

type CheckoutFormProps = { onComplete: (orderNo: string) => void };

export function CheckoutForm({ onComplete }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const setLines = useSetAtom(cartLinesAtom);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
    const firstInvalid = FIELDS.find(({ name }) => nextErrors[name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name=${firstInvalid.name}]`)?.focus();
      return;
    }
    pendingRef.current = true;
    setPending(true);
    try {
      const orderNo = await placeDemoOrder(data);
      setLines([]);
      onComplete(orderNo);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form ref={formRef} className={form} onSubmit={submit} noValidate>
      {hasErrors ? (
        <p role="alert" className={summaryBox}>
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
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
