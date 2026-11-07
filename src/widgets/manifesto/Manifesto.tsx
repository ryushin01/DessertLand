"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { css } from "styled-system/css";

import { gsap, useGsap, useMotionEnabled } from "@/shared/lib/motion";

const section = css({
  minHeight: "100svh",
  display: "grid",
  alignItems: "center",
  paddingBlock: "20vh",
  paddingInline: { base: "16px", md: "8vw" },
});
const text = css({
  fontFamily: "display",
  fontSize: "clamp(2rem, 5.2vw, 5.4rem)",
  lineHeight: "1.18",
  wordBreak: "var(--word-break)",
});
const hidden = css({ srOnly: true });

/** 스크롤에 따라 단어가 차례로 밝아지는 소개문입니다. */
export function Manifesto() {
  const t = useTranslations("manifesto");
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const enabled = useMotionEnabled();
  const copy = t("text");
  const pieces = locale === "ja" || locale === "zh" ? Array.from(copy) : copy.split(" ");
  const joiner = locale === "ja" || locale === "zh" ? "" : " ";

  useGsap(
    ref,
    ({ selector }) => {
      gsap.fromTo(
        selector?.("[data-word]") ?? [],
        { opacity: 0.45 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top 70%", end: "bottom 80%", scrub: 0.6 },
        },
      );
    },
    enabled,
    [copy],
  );

  return (
    <section ref={ref} className={section}>
      <p className={text}>
        <span className={hidden}>{copy}</span>
        <span aria-hidden="true">
          {pieces.map((piece, index) => (
            <span key={index} data-word>
              {piece}
              {joiner}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}
