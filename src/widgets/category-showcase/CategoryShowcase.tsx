"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { css } from "styled-system/css";

import { CATEGORIES, CATEGORY_COVERS, PRODUCTS, getProduct, type Category } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { gsap, scrollToY, useGsap, useMotionEnabled } from "@/shared/lib/motion";
import { Icon, buttonRecipe } from "@/shared/ui";

const wrapper = css({
  position: "relative",
  height: "300vh",
  marginBlockStart: "-200vh",
  "&:first-child": { marginBlockStart: 0 },
  "&:last-child": { height: "300vh" },
  zIndex: 1,
});
const stage = css({
  position: "sticky",
  insetBlockStart: 0,
  height: "100svh",
  overflow: "clip",
  background: "cocoa.950",
  willChange: "clip-path",
});
const backdrop = css({
  position: "absolute",
  inset: "-12%",
  filter: "blur(28px) brightness(0.42) saturate(1.3)",
  transform: "scale(1.15)",
});
const backdropImage = css({ objectFit: "cover" });
const layout = css({
  position: "relative",
  height: "100%",
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
  gridTemplateRows: { base: "minmax(0, 1fr) auto", md: "none" },
  gap: { base: "20px", md: "4vw" },
  alignItems: { md: "center" },
  paddingBlock: { base: "84px 24px", md: "0" },
  paddingInline: { base: "16px", md: "28px" },
});
const sharp = css({
  position: "relative",
  display: "flex",
  gap: { base: "12px", md: "18px" },
  height: { base: "100%", md: "62vh" },
  minHeight: 0,
});
const bar = css({
  width: "1px",
  flexShrink: 0,
  background: "rgba(247, 236, 223, 0.3)",
  position: "relative",
});
const barFill = css({
  position: "absolute",
  insetBlockStart: 0,
  insetInline: 0,
  height: "100%",
  background: "cream",
  transformOrigin: "top",
});
const frame = css({ position: "relative", flex: 1, overflow: "hidden", borderRadius: "4px" });
const frameImage = css({ objectFit: "cover" });
const info = css({ display: "grid", gap: { base: "12px", md: "24px" } });
const meta = css({
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.85rem",
  fontVariantNumeric: "tabular-nums",
});
const heading = css({
  fontFamily: "display",
  fontSize: "clamp(3rem, 11vw, 12rem)",
  lineHeight: "0.92",
  textTransform: "uppercase",
  wordBreak: "var(--word-break)",
});
const lede = css({ fontSize: { base: "1rem", md: "1.2rem" }, lineHeight: "1.5", maxWidth: "32rem", wordBreak: "var(--word-break)" });

export function CategoryShowcase() {
  const t = useTranslations("showcase");
  return (
    <section aria-label={t("label")}>
      {CATEGORIES.map((category, index) => (
        <Chapter key={category} category={category} index={index} first={index === 0} />
      ))}
    </section>
  );
}

function Chapter({ category, index, first }: { category: Category; index: number; first: boolean }) {
  const t = useTranslations("showcase");
  const tCategories = useTranslations("categories");
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionEnabled();
  const cover = getProduct(CATEGORY_COVERS[category]);
  const count = PRODUCTS.filter((product) => product.category === category).length;

  useGsap(
    ref,
    ({ selector }) => {
      const select = selector ?? (() => []);
      const trigger = ref.current;
      const stageEl = select("[data-stage]")[0];
      if (!first) {
        gsap.fromTo(
          stageEl,
          { clipPath: "circle(0% at 50% 60%)" },
          {
            clipPath: "circle(150% at 50% 60%)",
            ease: "power2.in",
            scrollTrigger: { trigger, start: "top top", end: "+=100%", scrub: 0.4 },
          },
        );
      }
      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: first ? "top 80%" : "top top",
          end: first ? "top top" : "+=100%",
          scrub: 0.5,
        },
      });
      reveal
        .from(select("[data-title]"), { yPercent: 40, opacity: 0, ease: "power2.out" }, 0.2)
        .from(select("[data-frame]"), { scale: 0.86, ease: "power2.out" }, 0.1)
        .from(select("[data-frame-image]"), { scale: 1.45, ease: "power2.out" }, 0.1);
      gsap.fromTo(
        select("[data-bar]"),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger, start: "top top", end: "bottom bottom", scrub: true },
        },
      );
      gsap.fromTo(
        select("[data-backdrop]"),
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    },
    enabled,
  );

  if (!cover) return null;
  const name = tCategories(`${category}.name`);

  return (
    <div
      ref={ref}
      className={wrapper}
      onFocus={() => {
        // 키보드로 들어오면 가려진 장면을 완전히 펼쳐 보여 줍니다.
        const top = ref.current?.getBoundingClientRect().top;
        if (top === undefined) return;
        scrollToY(window.scrollY + top + window.innerHeight);
      }}
    >
      <div data-stage className={stage}>
        <div data-backdrop aria-hidden="true" className={backdrop}>
          <Image src={cover.image.src} alt="" fill sizes="20vw" quality={40} className={backdropImage} />
        </div>
        <div className={layout}>
          <div className={sharp}>
            <div aria-hidden="true" className={bar}>
              <div data-bar className={barFill} />
            </div>
            <div data-frame className={frame}>
              <Image
                data-frame-image
                src={cover.image.src}
                alt=""
                fill
                sizes="(max-width: 768px) 90vw, 42vw"
                className={frameImage}
              />
            </div>
          </div>
          <div className={info}>
            <p className={meta}>
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}
              </span>
              <span>{t("count", { count })}</span>
            </p>
            <h2 data-title className={heading}>
              {name}
            </h2>
            <p className={lede}>{tCategories(`${category}.lede`)}</p>
            <p>
              <Link
                href={{ pathname: "/shop", query: { category } }}
                className={buttonRecipe({ tone: "outline" })}
                data-magnetic
              >
                {t("cta", { category: name })}
                <Icon name="arrow-right" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
