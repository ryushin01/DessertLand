import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./admin-kit.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

/** 주 동작: 밑줄 글자 버튼(원본 "Send"). */
export function TextButton({ children, className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={`${styles.textButton} ${className ?? ""}`} {...props}>
      {children}
    </button>
  );
}

/** 밑줄 글자 링크. */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.textButton}>
      {children}
    </Link>
  );
}

/** 확정·위험 동작: 검은 알약 버튼. ghost는 테두리만. */
export function PillButton({
  children,
  className,
  type = "button",
  ghost = false,
  ...props
}: ButtonProps & { ghost?: boolean }) {
  return (
    <button
      type={type}
      className={`${styles.pillButton} ${ghost ? styles.pillButtonGhost : ""} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** 알약 모양 링크. */
export function PillLink({
  href,
  children,
  ghost = false,
}: {
  href: string;
  children: ReactNode;
  ghost?: boolean;
}) {
  return (
    <Link href={href} className={`${styles.pillButton} ${ghost ? styles.pillButtonGhost : ""}`}>
      {children}
    </Link>
  );
}
