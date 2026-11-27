import { useId, type ComponentProps, type ReactNode } from "react";

import styles from "./admin-kit.module.css";

type Common = {
  label: string;
  /** 무엇이 잘못됐고 어떻게 고치는지. 있으면 aria-invalid와 aria-describedby로 칸에 잇습니다. */
  error?: string;
  hint?: string;
};

/** 오류·도움말 문구 id를 칸에 잇는 속성. 오류가 있는 칸에만 aria-invalid를 붙입니다. */
function describe(id: string, error?: string, hint?: string) {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ");
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": ids || undefined,
  } as const;
}

function Messages({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {hint ? (
        <span id={`${id}-hint`} className={styles.hint}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      ) : null}
    </>
  );
}

export function TextField({ label, error, hint, id, ...props }: Common & ComponentProps<"input">) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <input id={fieldId} className={styles.input} {...describe(fieldId, error, hint)} {...props} />
      <Messages id={fieldId} error={error} hint={hint} />
    </div>
  );
}

export function TextArea({
  label,
  error,
  hint,
  id,
  ...props
}: Common & ComponentProps<"textarea">) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={fieldId}
        className={styles.input}
        {...describe(fieldId, error, hint)}
        {...props}
      />
      <Messages id={fieldId} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  id,
  children,
  ...props
}: Common & ComponentProps<"select"> & { children: ReactNode }) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <select id={fieldId} className={styles.input} {...describe(fieldId, error, hint)} {...props}>
        {children}
      </select>
      <Messages id={fieldId} error={error} hint={hint} />
    </div>
  );
}

type ChipGroupProps<T extends string> = {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: readonly T[];
  onChange: (next: T[]) => void;
  name: string;
};

/** 여러 개 고르기: 체크박스를 알약 칩으로 보여 줍니다(키보드·화면 읽기는 체크박스 그대로). */
export function ChipGroup<T extends string>({
  legend,
  options,
  labels,
  value,
  onChange,
  name,
}: ChipGroupProps<T>) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option} className={styles.chip}>
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={value.includes(option)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? options.filter((item) => item === option || value.includes(item))
                    : value.filter((item) => item !== option),
                )
              }
            />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
