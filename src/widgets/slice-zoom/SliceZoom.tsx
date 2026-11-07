"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { css } from "styled-system/css";

import { getProduct } from "@/entities/product";
import { gsap, useGsap, useMotionEnabled } from "@/shared/lib/motion";

const wrapper = css({ position: "relative", height: "320vh", zIndex: 2, background: "cocoa.950" });
const stage = css({ position: "sticky", insetBlockStart: 0, height: "100svh", overflow: "clip" });
const image = css({ objectFit: "cover" });
const scrim = css({ position: "absolute", inset: 0, background: "rgba(18, 11, 10, 0.66)" });
const mask = css({
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  background: "#120b0a",
  color: "white",
  mixBlendMode: "multiply",
  fontFamily: "display",
  fontSize: "24vw",
  lineHeight: "1",
  willChange: "transform",
  _motionOff: { display: "none" },
});
const copy = css({
  position: "absolute",
  inset: 0,
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "20px",
  padding: "16px",
  textAlign: "center",
});
const title = css({
  fontFamily: "display",
  fontSize: "clamp(2.8rem, 8vw, 8rem)",
  lineHeight: "1",
  wordBreak: "var(--word-break)",
});
const body = css({ maxWidth: "34rem", fontSize: "1.1rem", lineHeight: "1.55", wordBreak: "var(--word-break)" });

/** 글자 안의 사진으로 빨려 들어가는 스크롤 줌입니다. */
export function SliceZoom() {
  const t = useTranslations("zoom");
  const ref = useRef<HTMLElement>(null);
  const enabled = useMotionEnabled();
  const product = getProduct("black-forest-cake");

  useGsap(
    ref,
    ({ selector }) => {
      const select = selector ?? (() => []);
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      timeline
        .fromTo(
          select("[data-mask]"),
          { scale: 1, transformOrigin: "52% 50%" },
          { scale: 34, ease: "power2.in", duration: 1 },
          0,
        )
        .to(select("[data-mask]"), { autoAlpha: 0, ease: "none", duration: 0.3 }, 0.7)
        .from(select("[data-image]"), { scale: 1.3, ease: "none", duration: 1.5 }, 0)
        .from(select("[data-scrim]"), { opacity: 0, duration: 0.2 }, 0.9)
        .from(select("[data-copy]"), { y: 60, opacity: 0, duration: 0.4 }, 1);
    },
    enabled,
  );

  if (!product) return null;

  return (
    <section ref={ref} className={wrapper}>
      <div className={stage}>
        <div data-image className={css({ position: "absolute", inset: 0 })}>
          <Image src={product.image.src} alt="" fill sizes="100vw" className={image} />
        </div>
        <div data-scrim aria-hidden="true" className={scrim} />
        <div data-copy className={copy}>
          <h2 className={title}>{t("title")}</h2>
          <p className={body}>{t("body")}</p>
        </div>
        <div data-mask aria-hidden="true" className={mask} lang="en">
          SWEET
        </div>
      </div>
    </section>
  );
}
