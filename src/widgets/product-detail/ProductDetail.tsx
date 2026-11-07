"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { css } from "styled-system/css";

import { MAX_QUANTITY } from "@/entities/cart";
import { countryName, formatProductPrice, type Product } from "@/entities/product";
import { AddToCartButton } from "@/features/add-to-cart";
import { BuyNowLink } from "@/features/buy-now";
import { Link } from "@/shared/i18n";
import { gsap, useGsap } from "@/shared/lib/motion/gsap";
import { useMediaQuery, useMotionEnabled } from "@/shared/lib/motion";
import { Icon, QuantityStepper } from "@/shared/ui";
import { RevealText } from "@/shared/ui/reveal-text";

const root = css({ position: "relative", overflow: "clip", minHeight: "100svh" });
const backdrop = css({
  position: "absolute",
  inset: "-10%",
  filter: "blur(30px) brightness(0.36) saturate(1.3)",
});
const cover = css({ objectFit: "cover" });
const layout = css({
  position: "relative",
  display: "grid",
  gridTemplateColumns: { base: "1fr", lg: "minmax(0, 6fr) minmax(0, 6fr)" },
  gap: { base: "28px", lg: "5vw" },
  alignItems: "center",
  minHeight: "100svh",
  paddingBlock: { base: "88px 48px", lg: "96px 48px" },
  paddingInline: { base: "16px", md: "28px" },
});
const tiltHost = css({ perspective: "1100px" });
const frame = css({
  position: "relative",
  aspectRatio: { base: "4 / 3", lg: "4 / 5" },
  maxHeight: "78vh",
  width: "100%",
  overflow: "hidden",
  borderRadius: "8px",
  boxShadow: "0 50px 110px rgba(0, 0, 0, 0.55)",
  transformStyle: "preserve-3d",
  willChange: "transform",
});
const shine = css({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  mixBlendMode: "soft-light",
  background:
    "radial-gradient(40% 40% at var(--shine-x, 50%) var(--shine-y, 40%), rgba(255, 255, 255, 0.9), transparent 70%)",
});
const info = css({ display: "grid", gap: "22px" });
const back = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  minHeight: "44px",
  fontSize: "0.9rem",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  "& i": { transform: "scaleX(-1)" },
});
const title = css({
  fontFamily: "display",
  fontSize: "clamp(3rem, 7vw, 7.5rem)",
  lineHeight: "1",
  textTransform: "uppercase",
  wordBreak: "var(--word-break)",
});
const description = css({ fontSize: "1.1rem", lineHeight: "1.6", maxWidth: "36rem", wordBreak: "var(--word-break)" });
const specs = css({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "8px 24px",
  fontSize: "0.95rem",
  "& dt": { color: "muted" },
});
const price = css({ fontSize: "1.9rem" });
const buy = css({ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" });
const notice = css({ fontSize: "0.82rem", color: "muted" });

export function ProductDetail({ product }: { product: Product }) {
  const t = useTranslations("product");
  const tProducts = useTranslations("products");
  const tAllergens = useTranslations("allergens");
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);
  const ref = useRef<HTMLElement>(null);
  const motion = useMotionEnabled();
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");

  useGsap(
    ref,
    ({ selector }) => {
      const select = selector ?? (() => []);
      const [frameEl] = select("[data-frame]") as HTMLElement[];
      if (!frameEl) return;
      gsap.from(frameEl, { clipPath: "inset(100% 0 0 0)", duration: 1.4, ease: "expo.out" });
      gsap.from(select("[data-rise]"), { y: 28, opacity: 0, duration: 1, stagger: 0.07, ease: "expo.out", delay: 0.25 });
      if (!fine) return;
      const rotY = gsap.quickTo(frameEl, "rotationY", { duration: 0.8, ease: "power3" });
      const rotX = gsap.quickTo(frameEl, "rotationX", { duration: 0.8, ease: "power3" });
      const onMove = (event: PointerEvent) => {
        const rect = frameEl.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = (event.clientY - rect.top) / rect.height;
        rotY(gsap.utils.clamp(-1, 1, nx - 0.5) * 14);
        rotX(gsap.utils.clamp(-1, 1, 0.5 - ny) * 10);
        frameEl.style.setProperty("--shine-x", `${nx * 100}%`);
        frameEl.style.setProperty("--shine-y", `${ny * 100}%`);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    },
    motion,
    [fine],
  );

  const name = tProducts(`${product.slug}.name` as Parameters<typeof tProducts>[0]) as string;
  const descriptionText = tProducts(
    `${product.slug}.description` as Parameters<typeof tProducts>[0],
  ) as string;

  return (
    <section ref={ref} className={root}>
      <div aria-hidden="true" className={backdrop}>
        <Image src={product.image.src} alt="" fill sizes="20vw" quality={40} className={cover} />
      </div>
      <div className={layout}>
        <div className={tiltHost}>
          <div data-frame className={frame}>
            <Image
              src={product.image.src}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={cover}
            />
            <div aria-hidden="true" className={shine} />
          </div>
        </div>
        <div className={info}>
          <Link href="/shop" className={back} data-rise>
            <Icon name="arrow-right" />
            {t("back")}
          </Link>
          <RevealText as="h1" text={name} className={title} immediate />
          <p className={description} data-rise>
            {descriptionText}
          </p>
          <dl className={specs} data-rise>
            <dt>{t("origin")}</dt>
            <dd>{countryName(product.country, locale)}</dd>
            <dt>{t("weight")}</dt>
            <dd>{new Intl.NumberFormat(locale, { style: "unit", unit: "gram" }).format(product.weightGrams)}</dd>
            <dt>{t("allergens")}</dt>
            <dd>{product.allergens.map((item) => tAllergens(item)).join(", ")}</dd>
          </dl>
          <p className={price} data-rise>
            {formatProductPrice(product.priceUsd, locale)}
          </p>
          <div className={buy} data-rise>
            <QuantityStepper
              value={quantity}
              max={MAX_QUANTITY}
              onChange={setQuantity}
              label={t("quantity")}
              decreaseLabel={t("decrease")}
              increaseLabel={t("increase")}
            />
            <AddToCartButton slug={product.slug} quantity={quantity}>
              {t("add")}
            </AddToCartButton>
            <BuyNowLink slug={product.slug} quantity={quantity}>
              {t("buyNow")}
            </BuyNowLink>
          </div>
          <p className={notice} data-rise>
            {t("notice")}
          </p>
        </div>
      </div>
    </section>
  );
}
