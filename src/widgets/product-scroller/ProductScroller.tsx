"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";

import { countryName, formatProductPrice, type Product } from "@/entities/product";
import { AddToCartButton } from "@/features/add-to-cart";
import { BuyNowLink } from "@/features/buy-now";
import { Link } from "@/shared/i18n";
import { useMotionEnabled } from "@/shared/lib/motion";

const root = css({ position: "relative" });
const backdrop = css({
  position: "sticky",
  insetBlockStart: 0,
  height: "100svh",
  marginBlockEnd: "-100svh",
  overflow: "clip",
  zIndex: 0,
});
const backdropImage = css({
  position: "absolute",
  inset: "-8%",
  opacity: 0,
  transition: "opacity 0.9s",
  filter: "blur(26px) brightness(0.38) saturate(1.25)",
  "&[data-active=true]": { opacity: 1 },
});
const cover = css({ objectFit: "cover" });
const columns = css({
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: { base: "1fr", lg: "minmax(0, 5fr) minmax(0, 7fr)" },
});
const preview = css({
  display: { base: "none", lg: "flex" },
  position: "sticky",
  insetBlockStart: 0,
  height: "100svh",
  alignItems: "center",
  paddingInline: "28px",
});
const previewFrame = css({
  position: "relative",
  width: "100%",
  height: "58vh",
  overflow: "hidden",
  borderRadius: "4px",
});
const previewImage = css({
  objectFit: "cover",
  opacity: 0,
  transform: "scale(1.12)",
  transition: "opacity 0.7s, transform 1.3s {easings.silk}",
  "&[data-active=true]": { opacity: 1, transform: "scale(1)" },
});
const list = css({
  borderInlineStart: { lg: "1px solid rgba(247, 236, 223, 0.35)" },
  paddingBlock: { base: "16px 80px", lg: "30vh" },
});
const row = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "minmax(0, 1fr) auto" },
  gap: "16px",
  alignItems: "center",
  minHeight: { lg: "44vh" },
  paddingBlock: { base: "28px", lg: "20px" },
  paddingInline: { base: "16px", md: "28px" },
});
const inlinePhoto = css({
  display: { lg: "none" },
  position: "relative",
  aspectRatio: "4 / 3",
  overflow: "hidden",
  borderRadius: "6px",
  marginBlockEnd: "14px",
});
const nameLink = css({
  display: "block",
  fontFamily: "display",
  fontSize: "clamp(2.6rem, 6.2vw, 7rem)",
  lineHeight: "1.02",
  textTransform: "uppercase",
  wordBreak: "var(--word-break)",
  color: "rgba(247, 236, 223, 0.6)",
  transition: "color 0.5s, transform 0.7s {easings.silk}",
  "&[data-active=true]": { color: "cream", transform: "translateX(14px)" },
  _motionOff: { "&[data-active=true]": { transform: "none" } },
});
const details = css({
  display: "grid",
  gap: "10px",
  justifyItems: { md: "end" },
  textAlign: { md: "end" },
  fontSize: "0.9rem",
});

const actions = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  justifyContent: { md: "flex-end" },
});

type ProductScrollerProps = { products: Product[] };

/** 가운데에 온 상품을 강조하고, 배경과 왼쪽 사진을 그 상품으로 바꾸는 목록입니다. */
export function ProductScroller({ products }: ProductScrollerProps) {
  const t = useTranslations("shop");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const motion = useMotionEnabled();
  const [activeSlug, setActiveSlug] = useState(products[0]?.slug);
  // 겹쳐 놓은 사진 16장을 한꺼번에 받지 않도록, 지금 상품과 다음 상품부터 차례로 받습니다.
  const [loaded, setLoaded] = useState(() => new Set(products.slice(0, 2).map(({ slug }) => slug)));
  const listRef = useRef<HTMLUListElement>(null);
  const activateRef = useRef<(slug: string | undefined) => void>(() => {});

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-slug]");
    if (!items) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activateRef.current((entry.target as HTMLElement).dataset.slug);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [products]);

  const activate = (slug: string | undefined) => {
    if (!slug) return;
    setActiveSlug(slug);
    const index = products.findIndex((product) => product.slug === slug);
    const next = products[index + 1]?.slug;
    setLoaded((current) => {
      if (current.has(slug) && (!next || current.has(next))) return current;
      const updated = new Set(current).add(slug);
      return next ? updated.add(next) : updated;
    });
  };

  useEffect(() => {
    activateRef.current = activate;
  });

  const nameOf = (slug: string) =>
    tProducts(`${slug}.name` as Parameters<typeof tProducts>[0]) as string;

  return (
    <div className={root} data-motion-state={motion ? "on" : "off"}>
      <div aria-hidden="true" className={backdrop}>
        {products.map((product) => (
          <div
            key={product.slug}
            className={backdropImage}
            data-active={product.slug === activeSlug}
          >
            {loaded.has(product.slug) ? (
              <Image
                src={product.image.src}
                alt=""
                fill
                sizes="20vw"
                quality={40}
                className={cover}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className={columns}>
        <div aria-hidden="true" className={preview}>
          <div className={previewFrame}>
            {products
              .filter((product) => loaded.has(product.slug))
              .map((product) => (
                <Image
                  key={product.slug}
                  src={product.image.src}
                  alt=""
                  fill
                  sizes="40vw"
                  className={previewImage}
                  data-active={product.slug === activeSlug}
                />
              ))}
          </div>
        </div>
        <ul ref={listRef} className={list}>
          {products.map((product) => {
            const active = product.slug === activeSlug;
            const name = nameOf(product.slug);
            return (
              <li
                key={product.slug}
                data-slug={product.slug}
                className={row}
                onPointerEnter={() => activate(product.slug)}
                onFocusCapture={() => activate(product.slug)}
              >
                <div>
                  <div className={inlinePhoto}>
                    <Image src={product.image.src} alt="" fill sizes="100vw" className={cover} />
                  </div>
                  <Link
                    href={`/shop/${product.slug}`}
                    className={cx(nameLink)}
                    data-active={active}
                    data-cursor={t("view")}
                  >
                    {name}
                  </Link>
                </div>
                <div className={details}>
                  <p>{countryName(product.country, locale)}</p>
                  <p>{formatProductPrice(product.priceUsd, locale)}</p>
                  <div className={actions}>
                    <AddToCartButton
                      slug={product.slug}
                      size="sm"
                      tone="outline"
                      accessibleName={t("add", { name })}
                    >
                      {t("addShort")}
                    </AddToCartButton>
                    <BuyNowLink
                      slug={product.slug}
                      quantity={1}
                      size="sm"
                      tone="solid"
                      accessibleName={t("buyNow", { name })}
                    >
                      {t("buyNowShort")}
                    </BuyNowLink>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
