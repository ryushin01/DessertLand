import type { ReactNode } from "react";

import styles from "./admin-kit.module.css";

type PillProps = { children: ReactNode; tone?: "outline" | "solid" | "dashed" };

/** 상태 배지: 높이 30px 알약. 강조 상태는 검은 채움. */
export function Pill({ children, tone = "outline" }: PillProps) {
  const toneClass =
    tone === "solid" ? styles.pillSolid : tone === "dashed" ? styles.pillDashed : "";
  return <span className={`${styles.pill} ${toneClass}`}>{children}</span>;
}
