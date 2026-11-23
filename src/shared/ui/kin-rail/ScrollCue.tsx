import { css } from "styled-system/css";

const cue = css({
  display: "inline-flex",
  flexDirection: "column",
  gap: "12px",
  fontSize: "0.75rem",
  lineHeight: "1.5",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  maxWidth: "7em",
  wordBreak: "var(--word-break)",
});
// 붉은 세로선 끝의 꺾인 화살촉
const arrow = css({
  position: "relative",
  display: "block",
  width: "1px",
  height: "3.9em",
  background: "signal",
  _after: {
    content: '""',
    position: "absolute",
    insetBlockEnd: "0",
    insetInlineStart: "0",
    width: "1px",
    height: "1em",
    background: "signal",
    transform: "rotate(45deg)",
    transformOrigin: "50% 100%",
  },
  animation: "bob 1.6s ease-in-out infinite",
  _motionOff: { animation: "none" },
});

/** 레퍼런스의 'SCROLL FOR MORE'와 붉은 화살표. 장식 문구라 보조 기술에서는 숨깁니다. */
export function ScrollCue({ label }: { label: string }) {
  return (
    <span className={cue} aria-hidden="true">
      {label}
      <span className={arrow} />
    </span>
  );
}
