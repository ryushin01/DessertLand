import { defineConfig } from "@pandacss/dev";
import presetBase from "@pandacss/preset-base";
import presetPanda from "@pandacss/preset-panda";

export default defineConfig({
  presets: [presetBase, presetPanda],
  preflight: true,
  jsxFramework: "react",
  include: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  conditions: {
    extend: {
      motionOff: "html[data-motion=off] &",
      fineHover: "@media (hover: hover) and (pointer: fine)",
    },
  },
  globalCss: {
    html: {
      background: "cocoa.950",
      color: "cream",
      fontFamily: "body",
      WebkitFontSmoothing: "antialiased",
      textRendering: "optimizeLegibility",
    },
    body: { background: "cocoa.950", minHeight: "100svh", overflowX: "clip" },
    "::selection": { background: "strawberry", color: "cocoa.950" },
    ":focus-visible": {
      outline: "3px solid {colors.caramel}",
      outlineOffset: "3px",
      borderRadius: "2px",
    },
    "html.lenis, html.lenis body": { height: "auto" },
    ".lenis.lenis-stopped": { overflow: "clip" },
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animationDuration: "0.01ms !important",
        animationIterationCount: "1 !important",
        transitionDuration: "0.01ms !important",
        scrollBehavior: "auto !important",
      },
    },
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          cocoa: {
            950: { value: "#120b0a" },
            900: { value: "#1c1210" },
            800: { value: "#2b1c18" },
            700: { value: "#46302a" },
          },
          cream: { value: "#f7ecdf" },
          muted: { value: "#d3c4b3" },
          strawberry: { value: "#ff6484" },
          caramel: { value: "#f2b267" },
          pistachio: { value: "#b9d98b" },
        },
        fonts: {
          display: {
            value:
              "var(--font-display), var(--font-cjk-serif, serif), 'AppleMyungjo', 'Batang', 'Times New Roman', serif",
          },
          body: {
            value:
              "var(--font-body), var(--font-cjk-sans, sans-serif), 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif",
          },
        },
        easings: {
          silk: { value: "cubic-bezier(0.16, 1, 0.3, 1)" },
        },
      },
      keyframes: {
        marquee: {
          from: { transform: "translate3d(0, 0, 0)" },
          to: { transform: "translate3d(-50%, 0, 0)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "20%": { transform: "translate(-3%, 2%)" },
          "40%": { transform: "translate(2%, -4%)" },
          "60%": { transform: "translate(-2%, 3%)" },
          "80%": { transform: "translate(3%, -2%)" },
        },
        drawerIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        curtainFallback: { to: { visibility: "hidden" } },
        advisorRise: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        advisorPulse: {
          "0%, 100%": { opacity: 0.45 },
          "50%": { opacity: 0.9 },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
      },
    },
  },
});
