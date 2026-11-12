"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef, type FocusEvent } from "react";
import { css } from "styled-system/css";

import { OTHER_COUNTRY, PRODUCTS, countryName, formatProductPrice } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { ScrollTrigger, gsap, useGsap } from "@/shared/lib/motion/gsap";
import { scrollToY, useMediaQuery, useMotionEnabled } from "@/shared/lib/motion";

/** 가로 여행이 너무 길어지지 않게, 나라마다 첫 상품 하나씩 16곳까지만 들릅니다. 기타(XX)는 들르지 않습니다. */
const MAX_STOPS = 16;
const STOPS = PRODUCTS.filter(
  (product, index) =>
    product.country !== OTHER_COUNTRY &&
    PRODUCTS.findIndex((item) => item.country === product.country) === index,
).slice(0, MAX_STOPS);

const wrapper = css({ position: "relative", zIndex: 2, background: "cocoa.950" });
const stage = css({
  paddingBlock: "80px",
  "&[data-horizontal=true]": {
    position: "sticky",
    insetBlockStart: 0,
    height: "100svh",
    overflow: "clip",
    paddingBlock: 0,
    display: "flex",
    alignItems: "center",
  },
});
const track = css({
  display: "grid",
  gap: "32px",
  paddingInline: { base: "16px", md: "28px" },
  gridTemplateColumns: { base: "1fr", sm: "1fr 1fr" },
  "&[data-horizontal=true]": { display: "flex", width: "max-content", alignItems: "center", gap: "4vw" },
});
const intro = css({
  gridColumn: { sm: "1 / -1" },
  "&[data-horizontal=true]": { width: "44vw", flexShrink: 0 },
});
const introTitle = css({
  fontFamily: "display",
  fontSize: "clamp(3rem, 7.6vw, 8rem)",
  lineHeight: "0.98",
  wordBreak: "var(--word-break)",
  marginBlockEnd: "20px",
});
const list = css({ display: "contents" });
const card = css({
  "&[data-horizontal=true]": {
    width: "min(27vw, 46vh)",
    flexShrink: 0,
    "&:nth-child(even)": { transform: "translateY(7vh)" },
    "&:nth-child(odd)": { transform: "translateY(-5vh)" },
  },
});
const cardLink = css({ display: "block", _hover: { "& [data-photo]": { transform: "scale(1.08)" } } });
const photoFrame = css({ position: "relative", aspectRatio: "4 / 5", overflow: "hidden", borderRadius: "6px" });
const photo = css({ objectFit: "cover", transition: "transform 1s {easings.silk}" });
const meta = css({
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBlockStart: "12px",
  fontSize: "0.82rem",
  color: "muted",
});
const name = css({ fontFamily: "display", fontSize: "clamp(1.6rem, 2.6vw, 2.6rem)", lineHeight: "1.1", marginBlockStart: "4px" });

/** 세로 스크롤을 가로 이동으로 바꾸는 국가별 디저트 여행입니다. */
export function WorldTour() {
  const t = useTranslations("world");
  const tProducts = useTranslations("products");
  const tShop = useTranslations("shop");
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const motion = useMotionEnabled();
  const large = useMediaQuery("(min-width: 900px)");
  const horizontal = motion && large;

  useGsap(
    ref,
    ({ selector }) => {
      const trackEl = trackRef.current;
      const root = ref.current;
      if (!trackEl || !root) return;
      const distance = () => trackEl.scrollWidth - window.innerWidth;
      const setHeight = () => {
        root.style.height = `${distance() + window.innerHeight}px`;
      };
      setHeight();
      const tween = gsap.to(trackEl, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: setHeight,
        },
      });
      triggerRef.current = tween.scrollTrigger ?? null;
      for (const image of (selector?.("[data-photo]") ?? []) as HTMLElement[]) {
        gsap.fromTo(
          image,
          { xPercent: -8, scale: 1.2 },
          {
            xPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: image.parentElement,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      }
      return () => {
        root.style.height = "";
        triggerRef.current = null;
      };
    },
    horizontal,
    [],
  );

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    // 가로로 밀려 있는 카드에 초점이 오면 해당 위치까지 스크롤합니다.
    const trigger = triggerRef.current;
    const trackEl = trackRef.current;
    if (!trigger || !trackEl) return;
    const li = event.target.closest("li");
    if (!li) return;
    const distance = trackEl.scrollWidth - window.innerWidth;
    const target = Math.min(distance, Math.max(0, li.offsetLeft - window.innerWidth * 0.3));
    scrollToY(trigger.start + (target / distance) * (trigger.end - trigger.start));
  };

  return (
    <section ref={ref} className={wrapper} onFocus={onFocus}>
      <div className={stage} data-horizontal={horizontal}>
        <div ref={trackRef} className={track} data-horizontal={horizontal}>
          <div className={intro} data-horizontal={horizontal}>
            <h2 className={introTitle}>{t("title")}</h2>
            <p>{t("lede")}</p>
          </div>
          <ul className={list}>
            {STOPS.map((product) => (
              <li key={product.slug} className={card} data-horizontal={horizontal}>
                <Link href={`/shop/${product.slug}`} className={cardLink} data-cursor={tShop("view")}>
                  <span className={photoFrame} style={{ display: "block" }}>
                    <Image
                      data-photo
                      src={product.image.src}
                      alt=""
                      fill
                      sizes="(min-width: 900px) 27vw, (min-width: 640px) 50vw, 100vw"
                      className={photo}
                    />
                  </span>
                  <span className={meta}>
                    <span>{countryName(product.country, locale)}</span>
                    <span lang="en">{product.coordinates}</span>
                  </span>
                  <span className={name} style={{ display: "block" }}>
                    {tProducts(`${product.slug}.name` as Parameters<typeof tProducts>[0]) as string}
                  </span>
                  <span>{formatProductPrice(product.priceUsd, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
