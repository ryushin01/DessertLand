"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import { PRODUCTS } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { gsap } from "@/shared/lib/gsap";
import { MEDIA, useMediaQuery, useMotionEnabled } from "@/shared/lib/motion";
import { Icon, buttonRecipe } from "@/shared/ui";
import { RevealText } from "@/shared/ui/reveal-text";

const section = css({
  position: "relative",
  zIndex: 2,
  minHeight: "100svh",
  overflow: "clip",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "32px",
  padding: "96px 16px",
  background: "cocoa.950",
  textAlign: "center",
});
const title = css({
  position: "relative",
  zIndex: 2,
  fontFamily: "display",
  fontSize: "clamp(3rem, 10vw, 11rem)",
  lineHeight: "1",
  wordBreak: "var(--word-break)",
  mixBlendMode: "difference",
  pointerEvents: "none",
});
const cta = css({ position: "relative", zIndex: 3 });
const trailItem = css({
  position: "absolute",
  insetBlockStart: 0,
  insetInlineStart: 0,
  width: "clamp(140px, 17vw, 280px)",
  aspectRatio: "4 / 5",
  borderRadius: "10px",
  overflow: "hidden",
  visibility: "hidden",
  zIndex: 1,
  pointerEvents: "none",
});
const trailImage = css({ objectFit: "cover" });

const TRAIL = PRODUCTS.slice(0, 12);

/** 마우스가 지나간 자리에 디저트 사진이 피어올랐다 사라집니다. */
export function SweetTrail() {
  const t = useTranslations("trail");
  const ref = useRef<HTMLElement>(null);
  const motion = useMotionEnabled();
  const fine = useMediaQuery(MEDIA.finePointer);
  const enabled = motion && fine;

  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-trail]"));
    let index = 0;
    let lastX = -999;
    let lastY = -999;
    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (Math.hypot(x - lastX, y - lastY) < 110) return;
      const dx = x - lastX;
      lastX = x;
      lastY = y;
      const item = items[index % items.length];
      index += 1;
      if (!item) return;
      const { offsetWidth: width, offsetHeight: height } = item;
      gsap.killTweensOf(item);
      gsap
        .timeline()
        .set(item, {
          autoAlpha: 1,
          x: x - width / 2,
          y: y - height / 2,
          scale: 0.4,
          rotation: gsap.utils.clamp(-14, 14, dx * 0.12),
          zIndex: index,
        })
        .to(item, { scale: 1, duration: 0.6, ease: "expo.out" })
        .to(item, { autoAlpha: 0, scale: 0.8, y: `+=70`, duration: 0.6, ease: "power2.in" }, 0.55);
    };
    root.addEventListener("pointermove", onMove);
    return () => {
      root.removeEventListener("pointermove", onMove);
      gsap.killTweensOf(items);
    };
  }, [enabled]);

  return (
    <section ref={ref} className={section}>
      {enabled
        ? TRAIL.map((product) => (
            <div key={product.slug} data-trail aria-hidden="true" className={trailItem}>
              <Image src={product.image.src} alt="" fill sizes="280px" className={trailImage} />
            </div>
          ))
        : null}
      <RevealText as="h2" text={t("title")} className={title} />
      <Link href="/shop" className={`${buttonRecipe()} ${cta}`} data-magnetic>
        {t("cta")}
        <Icon name="arrow-right" />
      </Link>
    </section>
  );
}
