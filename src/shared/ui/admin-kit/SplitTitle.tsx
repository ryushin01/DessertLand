import type { CSSProperties } from "react";

import styles from "./admin-kit.module.css";
import { Breadcrumbs, SlashMark } from "./Slash";

type SplitTitleProps = {
  /** 제목 위 10px 대문자 라벨(영문) */
  eyebrow: string;
  title: string;
  /** 한글 제목은 한글 세리프(Noto Serif KR 300)로 씁니다. */
  korean?: boolean;
  /** 경로(예: 상품 / 수정). 마지막 항목이 지금 화면입니다. */
  crumbs?: { label: string; href?: string }[];
};

/**
 * 페이지 제목: 작은 대문자 라벨 + 거대한 가는 세리프 + 긴 사선. 글자마다 왼쪽에서 들어옵니다(사선·마지막 글자부터).
 * 나눈 글자는 화면 읽기 프로그램에 숨기고, 제목은 한 덩어리로 읽힙니다.
 */
export function SplitTitle({ eyebrow, title, korean = true, crumbs }: SplitTitleProps) {
  const letters = [...title];
  return (
    <div className={styles.titleBlock}>
      {crumbs ? <Breadcrumbs items={crumbs} /> : null}
      <span className={styles.eyebrow} aria-hidden="true">
        {eyebrow}
      </span>
      <h1 className={korean ? `${styles.title} ${styles.titleKo}` : styles.title}>
        <span className={styles.srOnly}>{title}</span>
        <span className={styles.letters} aria-hidden="true">
          {letters.map((letter, index) => (
            <span
              // 글자 순서가 바뀌지 않으므로 위치를 키로 씁니다.
              key={index}
              className={styles.letter}
              style={{ "--from-end": letters.length - index } as CSSProperties}
            >
              {letter}
            </span>
          ))}
          {/* 원본 작품명처럼 두 칸 띄운 긴 사선. 마지막 글자라 가장 먼저 들어옵니다. */}
          <span className={styles.titleGap}> </span>
          <span className={styles.letter} style={{ "--from-end": 0 } as CSSProperties}>
            <SlashMark />
          </span>
        </span>
      </h1>
    </div>
  );
}
