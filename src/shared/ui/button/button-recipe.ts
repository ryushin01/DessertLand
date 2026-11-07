import { cva } from "styled-system/css";

/** 버튼과 링크가 함께 쓰는 스타일입니다. */
export const buttonRecipe = cva({
  base: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6em",
    minHeight: "48px",
    paddingInline: "1.5em",
    borderRadius: "999px",
    fontSize: "0.95rem",
    fontWeight: "500",
    lineHeight: "1.2",
    textAlign: "center",
    cursor: "pointer",
    overflow: "hidden",
    isolation: "isolate",
    transition: "color 0.4s, border-color 0.4s, background 0.4s",
    _before: {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "-1",
      borderRadius: "inherit",
      transform: "translateY(101%)",
      transition: "transform 0.6s {easings.silk}",
    },
    _hover: { _before: { transform: "translateY(0)" } },
    _disabled: { opacity: 0.55, cursor: "not-allowed" },
  },
  variants: {
    tone: {
      solid: {
        background: "cream",
        color: "cocoa.950",
        _before: { background: "strawberry" },
      },
      outline: {
        border: "1px solid {colors.cream}",
        color: "cream",
        _before: { background: "cream" },
        _hover: { color: "cocoa.950" },
      },
    },
    size: {
      md: {},
      sm: { minHeight: "40px", fontSize: "0.85rem", paddingInline: "1.1em" },
    },
  },
  defaultVariants: { tone: "solid", size: "md" },
});
