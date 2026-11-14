import { css } from "styled-system/css";

/** 결제·결제 완료처럼 글 위주 화면의 바깥 여백과 너비 */
export const pageShell = css({
  minHeight: "100svh",
  paddingBlock: "110px 72px",
  paddingInline: { base: "16px", md: "28px" },
  maxWidth: "1200px",
  marginInline: "auto",
});

/** 그 화면들의 큰 제목 */
export const pageTitle = css({
  fontFamily: "display",
  fontSize: "clamp(3rem, 8vw, 7rem)",
  lineHeight: "1",
  marginBlockEnd: "20px",
  wordBreak: "var(--word-break)",
});
