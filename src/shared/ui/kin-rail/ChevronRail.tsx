import { css, cx } from "styled-system/css";

/** 꺾쇠에서 가로 기준선이 지나는 마디(원)의 세로 위치 비율(SVG viewBox 높이 210 중 118) */
export const RAIL_NODE_RATIO = 118 / 210;

const rail = css({
  display: "block",
  width: "auto",
  height: "var(--rail-h, 13rem)",
  overflow: "visible",
  color: "cream",
  pointerEvents: "none",
  "& [data-draw]": {
    strokeDasharray: "1",
    strokeDashoffset: "0",
    animation: "railDraw 1.4s {easings.silk} both",
    _motionOff: { animation: "none" },
  },
  "& [data-draw='2']": { animationDelay: "0.25s" },
  "& [data-draw='3']": { animationDelay: "0.5s" },
});

type ChevronRailProps = { className?: string };

/**
 * 왼쪽의 하얀 꺾쇠. 위쪽 점과 끊긴 세로선, 가로 기준선이 지나는 원형 마디, 오른쪽 아래로 꺾인 사선과 짧은 세로선으로 이뤄집니다.
 * 장식이라 보조 기술에서는 숨깁니다.
 */
export function ChevronRail({ className }: ChevronRailProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 210"
      className={cx(rail, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="4" r="2.6" fill="currentColor" stroke="none" />
      <path data-draw="1" pathLength={1} d="M6 16 V40" />
      <path data-draw="2" pathLength={1} d="M6 52 V110" />
      <circle cx="6" cy="118" r="6" strokeWidth="2.5" />
      <path data-draw="3" pathLength={1} d="M10.5 122.5 L56 168 V206" />
    </svg>
  );
}
