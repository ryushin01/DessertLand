import { css } from "styled-system/css";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const grain = css({
  position: "fixed",
  inset: "-10%",
  zIndex: 90,
  pointerEvents: "none",
  opacity: 0.11,
  mixBlendMode: "overlay",
  animation: "grain 0.9s steps(4) infinite",
  _motionOff: { animation: "none" },
});

/** 화면 전체에 깔리는 필름 그레인입니다. */
export function Grain() {
  return <div aria-hidden="true" className={grain} style={{ backgroundImage: NOISE }} />;
}
