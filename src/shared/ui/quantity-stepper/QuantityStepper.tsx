"use client";

import { css } from "styled-system/css";

import { Icon } from "../icon";

const root = css({
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid {colors.cocoa.700}",
  borderRadius: "999px",
});
const control = css({
  width: "44px",
  height: "44px",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  cursor: "pointer",
  transition: "background 0.2s",
  _hover: { background: "cocoa.800" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
});
const value = css({ minWidth: "2.4ch", textAlign: "center", fontVariantNumeric: "tabular-nums" });

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
};

export function QuantityStepper({
  value: current,
  min = 1,
  max,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
}: QuantityStepperProps) {
  return (
    <div role="group" aria-label={label} className={root}>
      <button
        type="button"
        className={control}
        aria-label={decreaseLabel}
        disabled={current <= min}
        onClick={() => onChange(current - 1)}
      >
        <Icon name="minus" />
      </button>
      <output className={value} aria-live="polite">
        {current}
      </output>
      <button
        type="button"
        className={control}
        aria-label={increaseLabel}
        disabled={current >= max}
        onClick={() => onChange(current + 1)}
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
