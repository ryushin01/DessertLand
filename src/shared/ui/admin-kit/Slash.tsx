import Link from "next/link";
import type { CSSProperties, ElementType, ReactNode } from "react";

import styles from "./slash.module.css";

/**
 * 레퍼런스(marieweber.fr)의 긴 사선. 원본은 가는 디돈체(Schnyder Wide XL Light)의 "/" 글자라
 * 글꼴 크기의 약 1em 높이·0.49em 폭으로, 오른쪽 위에서 왼쪽 아래로 1px 남짓한 획이 뻗습니다.
 * 무료 대체 글꼴의 "/"는 짧고 굵어서, 같은 비율의 1px 선(SVG)으로 그립니다. 장식이라 화면 읽기에서 뺍니다.
 */
export function SlashMark({ className }: { className?: string }) {
  return (
    <span className={`${styles.slash} ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 49 107" preserveAspectRatio="none" focusable="false">
        <line x1="48" y1="2" x2="1" y2="105" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

type Badge = {
  /** 원 안의 한 글자(예: 분류 머리글자) */
  short: string;
  /** 가리키면 알약으로 펼쳐질 때의 글(예: 케이크) */
  long: string;
};

type SlashNameProps = {
  /** 화면에 보이고 읽히는 이름 */
  children: string;
  as?: ElementType;
  /** 이름 오른쪽 위의 원형 배지. 장식이므로 같은 정보를 srText로도 줍니다. */
  badge?: Badge;
  /** 배지 정보 등 화면 읽기 프로그램에 함께 읽힐 글 */
  srText?: string;
  /** 처음 나타날 때 글자 나누기 등장(사선이 먼저 들어옴)을 쓸지와 목록 안 순서(지연) */
  order?: number;
  className?: string;
};

/**
 * 원본 첫 화면의 작품 목록 한 줄: 거대한 가는 세리프 이름 + 두 칸 띄운 긴 사선 + 사선 왼쪽 위 원형 배지.
 * 가리키거나 초점이 오면 배지가 검은 알약으로 펼쳐지고, 같은 목록(.slashList)의 다른 이름은 흐려집니다.
 */
export function SlashName({
  children,
  as: Tag = "span",
  badge,
  srText,
  order = 0,
  className,
}: SlashNameProps) {
  const letters = [...children];
  return (
    <Tag
      className={`${styles.name} ${className ?? ""}`}
      style={{ "--order": order } as CSSProperties}
    >
      <span className={styles.srOnly}>
        {children}
        {srText ? ` (${srText})` : ""}
      </span>
      <span className={styles.letters} aria-hidden="true">
        {letters.map((letter, index) => (
          <span
            key={index}
            className={styles.letter}
            style={{ "--from-end": letters.length - index } as CSSProperties}
          >
            {letter}
          </span>
        ))}
        <span className={styles.gap}> </span>
        <span
          className={`${styles.letter} ${styles.slashLetter}`}
          style={{ "--from-end": 0 } as CSSProperties}
        >
          <SlashMark />
          {badge ? (
            <span className={styles.badge}>
              <span className={styles.badgeShort}>{badge.short}</span>
              <span className={styles.badgeLong}>{badge.long}</span>
            </span>
          ) : null}
        </span>
      </span>
    </Tag>
  );
}

/** SlashName 목록: 한 줄을 가리키면 나머지가 흐려집니다(원본 1초 색 전환). */
export function SlashList({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <ul className={`${styles.list} ${className ?? ""}`} aria-label={label}>
      {children}
    </ul>
  );
}

/**
 * 경로(빵부스러기). 의미는 목록으로 읽히고, 사이의 사선은 CSS 생성 글(대체 텍스트 "")이라 읽히지 않습니다.
 */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="경로" className={styles.crumbs}>
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
