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
    // 레퍼런스의 제목: 가는 획(300)과 넓은 자간
    "h1, h2": { fontWeight: "300", letterSpacing: "0.08em" },
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
          // 키노 무비(KIN) 레퍼런스의 밤하늘 남색·흰 선·붉은 신호색입니다. 이름은 기존 토큰을 그대로 둡니다.
          // cocoa = 바탕 남색 단계, cream = 흰 글자·선, strawberry = 붉은 강조 글자, caramel = 초점·보조 강조(하늘색)
          cocoa: {
            950: { value: "#00020e" },
            900: { value: "#060a1c" },
            800: { value: "#10162e" },
            700: { value: "#1f2846" },
          },
          cream: { value: "#ffffff" },
          muted: { value: "#a9afc2" },
          strawberry: { value: "#ff3e50" },
          signal: { value: "#e41313" },
          caramel: { value: "#a1f3fb" },
          pistachio: { value: "#b9e6a1" },
        },
        fonts: {
          display: {
            value:
              // 영문은 레퍼런스(KIN)처럼 가늘고 넓은 자간의 기하학 산세리프 Exo 2(OFL, 저장소 파일). 대체 글꼴은 Avenir Next·Helvetica Neue,
              // 한중일은 각 언어의 제목 글꼴과 운영체제 글꼴. 변수 기본값도 글꼴 이름으로 둬야 뒤의 대체 글꼴이 쓰입니다.
              "var(--font-exo), var(--font-cjk-serif, 'Avenir Next'), 'Avenir Next', 'Helvetica Neue', 'AppleMyungjo', 'Batang', 'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', 'SimSun', sans-serif",
          },
          body: {
            value:
              // 본문도 영문은 Exo 2. 대체 글꼴은 Avenir Next, 한중일은 각 언어의 본문 글꼴과 운영체제 글꼴.
              "var(--font-exo), var(--font-cjk-sans, 'Avenir Next'), 'Avenir Next', 'Helvetica Neue', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Hiragino Sans', 'Yu Gothic', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
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
        railDraw: { from: { strokeDashoffset: "1" }, to: { strokeDashoffset: "0" } },
        lineIn: { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
      },
    },
  },
});
