import { css } from "styled-system/css";

/** 분류·맛·성분 고르기에 함께 쓰는 알약 모양. 현재 분류(aria-current)와 고른 항목(aria-pressed)을 같은 모습으로 보여 줍니다. */
export const pill = css({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "44px",
  paddingInline: "16px",
  borderRadius: "0",
  border: "1px solid rgba(255, 255, 255, 0.4)",
  fontSize: "0.8rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "background 0.3s, color 0.3s",
  _hover: { background: "cocoa.800" },
  "&[aria-current=page], &[aria-pressed=true]": {
    background: "cream",
    color: "cocoa.950",
    borderColor: "cream",
    // 마우스를 올려도 고른 상태의 밝은 바탕을 유지합니다(어두운 바탕에 어두운 글자가 되지 않게).
    _hover: { background: "cream" },
  },
});

export const pillList = css({ display: "flex", flexWrap: "wrap", gap: "8px" });
