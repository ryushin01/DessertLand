import type { ReactNode } from "react";

import styles from "./admin-kit.module.css";

type EyebrowProps = { children: ReactNode; as?: "span" | "h2" | "p"; id?: string };

/** 10px 대문자 라벨(자간 0.3em). 구획 제목(h2)으로도 씁니다. */
export function Eyebrow({ children, as: Tag = "span", id }: EyebrowProps) {
  return (
    <Tag id={id} className={styles.eyebrow}>
      {children}
    </Tag>
  );
}
