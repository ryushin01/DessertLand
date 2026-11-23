import { css } from "styled-system/css";

/** 결제·결제 완료처럼 글 위주 화면의 바깥 여백과 너비 */
export const pageShell = css({
  minHeight: "100svh",
  paddingBlock: { base: "120px 72px", md: "160px 96px" },
  paddingInline: { base: "16px", md: "56px" },
  maxWidth: "1200px",
  marginInline: "auto",
});

/** 그 화면들의 큰 제목 */
export const pageTitle = css({
  fontFamily: "display",
  fontSize: "clamp(2.4rem, 5.6vw, 5.6rem)",
  fontWeight: "200",
  lineHeight: "1.05",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  wordBreak: "var(--word-break)",
});
