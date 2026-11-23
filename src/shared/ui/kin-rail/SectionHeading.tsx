import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

import { ChevronRail } from "./ChevronRail";

const root = css({
  "--rail-h": { base: "9.5rem", md: "13rem" },
  position: "relative",
  paddingInlineStart: { base: "3.6rem", md: "6.4rem" },
  // 꺾쇠의 아래쪽 꼬리와 '아래로' 안내가 들어갈 자리
  // 1 - RAIL_NODE_RATIO(118/210) = 0.4381. Panda는 정적으로 읽으므로 숫자로 적습니다.
  marginBlockEnd: "calc(var(--rail-h) * 0.4381 + 12px)",
});
const railBox = css({
  position: "absolute",
  insetInlineStart: { base: "2px", md: "10px" },
  insetBlockEnd: "calc(var(--rail-h) * -0.4381)",
});
// 화면 너비 전체를 가로지르는 가는 기준선(레퍼런스의 수평선). 꺾쇠 마디를 지납니다.
// 제목 묶음이 화면 어디에 있든 양 끝까지 닿도록 넉넉히 길게 둡니다. 감싸는 요소(화면 너비)에 overflow-x: clip을 줘야 문서가 넘치지 않습니다.
const line = css({
  position: "absolute",
  insetBlockEnd: "0",
  insetInlineStart: "-100vw",
  width: "300vw",
  height: "1px",
  background: "rgba(255, 255, 255, 0.5)",
  transformOrigin: "66.67% 50%",
  animation: "lineIn 1.2s {easings.silk} both",
  pointerEvents: "none",
  _motionOff: { animation: "none" },
  // 제목 묶음 너비까지만 긋는 경우(상품 상세처럼 사진 옆에 있을 때)
  "&[data-contained]": { insetInlineStart: "0", width: "100%", transformOrigin: "0 50%" },
});
const label = css({
  display: "block",
  fontFamily: "body",
  fontSize: "0.75rem",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "muted",
  marginBlockEnd: "10px",
});
const body = css({ paddingBlockEnd: { base: "10px", md: "14px" } });

type SectionHeadingProps = {
  /** 레퍼런스의 'SECTION — 01'처럼 왼쪽 위에 붙는 번호 */
  index: number;
  children: ReactNode;
  /** 기준선 아래, 꺾쇠 꼬리 옆에 두는 내용(예: '아래로 스크롤' 안내) */
  after?: ReactNode;
  /** 기준선을 화면 끝까지 그을지(bleed, 기본) 제목 묶음 너비까지만 그을지(contained) */
  line?: "bleed" | "contained";
  className?: string;
};

/** 왼쪽의 하얀 꺾쇠와 가로 기준선, 섹션 번호를 붙인 제목 묶음입니다. */
export function SectionHeading({
  index,
  children,
  after,
  line: lineMode = "bleed",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx(root, className)}>
      <span className={railBox}>
        <ChevronRail />
      </span>
      <div className={body}>
        <span className={label} aria-hidden="true" lang="en">
          Section — {String(index).padStart(2, "0")}
        </span>
        {children}
      </div>
      <span
        aria-hidden="true"
        className={line}
        data-contained={lineMode === "contained" ? "" : undefined}
      />
      {after ? <div className={afterBox}>{after}</div> : null}
    </div>
  );
}

const afterBox = css({
  position: "absolute",
  insetBlockStart: "calc(100% + 18px)",
  insetInlineStart: { base: "3.6rem", md: "6.4rem" },
});
