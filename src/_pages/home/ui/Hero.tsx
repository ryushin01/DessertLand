"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { css, cx } from "styled-system/css";

import { getProduct } from "@/entities/product";
import { Link } from "@/shared/i18n";
import { gsap, useGsap } from "@/shared/lib/gsap";
import { MEDIA, useMediaQuery, useMotionEnabled } from "@/shared/lib/motion";
import { Icon, ScrollCue, SectionHeading, buttonRecipe } from "@/shared/ui";

import type { BakerRenderer } from "../lib/baker-renderer";

const CUTOUT = "/images/hero/baker-cutout.webp";
const DEPTH = "/images/hero/baker-depth.webp";
const CUTOUT_RATIO = 1000 / 1250;

const FLOATS = [
  // 왼쪽 제목·꺾쇠 자리를 비우고 오른쪽 절반에 띄웁니다.
  { slug: "freakshake", top: "13%", left: "47%", width: "9vw", depth: 0.9, front: false, wide: false },
  { slug: "tiramisu", top: "15%", left: "80%", width: "10vw", depth: 0.6, front: false, wide: false },
  { slug: "basque-cheesecake", top: "68%", left: "47%", width: "14vw", depth: 1.5, front: true, wide: true },
  { slug: "pastel-de-nata", top: "62%", left: "77%", width: "16vw", depth: 1.8, front: true, wide: true },
  { slug: "strawberry-shortcake", top: "40%", left: "88%", width: "7vw", depth: 0.4, front: false, wide: false },
  { slug: "blueberry-muffin", top: "34%", left: "63%", width: "7vw", depth: 0.5, front: false, wide: false },
] as const;

const wrapper = css({ position: "relative", height: "240vh" });
const stage = css({
  position: "sticky",
  insetBlockStart: 0,
  height: "100svh",
  overflow: "clip",
  perspective: "1200px",
  // 레퍼런스의 밤하늘: 가운데 자줏빛, 오른쪽 위 청록 빛, 바깥은 남색
  background:
    "radial-gradient(40% 45% at 100% 0%, rgba(32, 150, 170, 0.35), transparent 70%), radial-gradient(55% 55% at 62% 45%, #3b0c2c 0%, #140a26 46%, {colors.cocoa.950} 100%)",
});
const glow = css({
  position: "absolute",
  width: "62vmax",
  height: "62vmax",
  insetBlockStart: 0,
  insetInlineStart: 0,
  marginBlockStart: "-31vmax",
  marginInlineStart: "-31vmax",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(228, 19, 19, 0.34), rgba(161, 243, 251, 0.1) 45%, transparent 68%)",
  pointerEvents: "none",
});
// 제목 묶음은 왼쪽에 두고, 꺾쇠 마디와 가로 기준선이 화면 세로 가운데(모바일은 조금 위)를 지나게 합니다.
const heading = css({
  "--rail-h": { base: "9.5rem", md: "13rem" },
  position: "absolute",
  zIndex: 3,
  // 손·밀가루 사진 위에서도 글자 대비가 유지되도록 남색 그림자를 둡니다.
  textShadow: "0 0 14px rgba(0, 2, 14, 0.95), 0 0 4px rgba(0, 2, 14, 0.9)",
  insetInlineStart: { base: "16px", md: "56px" },
  insetInlineEnd: { base: "16px", md: "auto" },
  // 안쪽 SectionHeading의 아래 여백(꺾쇠 꼬리 자리 = 높이 × 0.4381 + 12px)만큼 내려 기준선을 정확히 맞춥니다.
  insetBlockEnd: {
    base: "calc(58% - var(--rail-h) * 0.4381 - 12px)",
    md: "calc(50% - var(--rail-h) * 0.4381 - 12px)",
  },
});
const title = css({
  display: "flex",
  flexDirection: "column",
  fontFamily: "display",
  fontSize: "clamp(2.8rem, 6.4vw, 6.4rem)",
  fontWeight: "200",
  lineHeight: "1",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "cream",
  userSelect: "none",
});
const titleLine = css({ display: "block", willChange: "transform" });
const float = css({
  position: "absolute",
  display: { base: "none", md: "block" },
  aspectRatio: "3 / 4",
  borderRadius: "0",
  overflow: "hidden",
  outline: "1px solid rgba(255, 255, 255, 0.35)",
  outlineOffset: "6px",
  boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
  willChange: "transform",
});
const floatWide = css({
  display: "block",
  aspectRatio: "4 / 3",
  minWidth: "120px",
});
const floatImage = css({ objectFit: "cover" });
const baker = css({
  position: "absolute",
  insetBlockStart: "-7svh",
  insetInlineStart: { base: "50%", md: "98%" },
  height: { base: "82svh", md: "128svh" },
  transformOrigin: "50% 40%",
  willChange: "transform",
  "& canvas": { display: "block", width: "100% !important", height: "100% !important" },
});
const bakerFallback = css({
  position: "absolute",
  insetInline: "6.1%",
  insetBlockStart: 0,
  insetBlockEnd: "12.3%",
  objectFit: "cover",
  objectPosition: "top",
});
const copy = css({
  position: "absolute",
  zIndex: 4,
  insetBlockEnd: { base: "20px", md: "32px" },
  insetInline: { base: "16px", md: "56px" },
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "minmax(0, 24rem) 1fr auto" },
  alignItems: "end",
  gap: "16px",
});
const copyPanel = css({
  padding: "14px 16px",
  borderRadius: "0",
  borderInlineStart: "1px solid {colors.signal}",
  background: "rgba(0, 2, 14, 0.78)",
  backdropFilter: "blur(10px)",
});
const eyebrow = css({
  fontSize: "0.72rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  marginBlockEnd: "8px",
  color: "strawberry",
});
const tagline = css({
  fontSize: { base: "0.92rem", md: "1rem" },
  lineHeight: "1.6",
  letterSpacing: "0.02em",
  wordBreak: "var(--word-break)",
});
const actions = css({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  gridColumn: { md: "3" },
});
const scrollCueBox = css({ display: { base: "none", md: "block" } });

export function Hero() {
  const t = useTranslations("hero");
  const rootRef = useRef<HTMLDivElement>(null);
  const bakerRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const enabled = useMotionEnabled();
  const finePointer = useMediaQuery(MEDIA.finePointer);
  const [webglReady, setWebglReady] = useState(false);

  // WebGL 손과 밀가루. 실패하면 컷아웃 이미지를 그대로 보여 줍니다.
  useEffect(() => {
    const host = bakerRef.current;
    const root = rootRef.current;
    // 터치 기기는 마우스 시차가 없으므로 WebGL과 그 코드를 받지 않아 첫 화면을 가볍게 합니다.
    if (!enabled || !finePointer || !host || !root) return;

    let disposed = false;
    let bakerRenderer: BakerRenderer | null = null;
    let visible = true;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const intro = { value: 0 };
    const onPointer = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(root);
    const tick = (time: number) => {
      if (!bakerRenderer || !visible) return;
      pointer.x += (pointer.targetX - pointer.x) * 0.07;
      pointer.y += (pointer.targetY - pointer.y) * 0.07;
      bakerRenderer.render({ pointerX: pointer.x, pointerY: pointer.y, time, intro: intro.value });
    };
    const resize = () => {
      const rect = host.getBoundingClientRect();
      // 변환 전 크기를 씁니다.
      bakerRenderer?.resize(host.offsetWidth || rect.width, host.offsetHeight || rect.height);
    };
    // GPU가 컨텍스트를 거둬 가면(드라이버 재시작, 열린 탭이 많을 때 등) 빈 캔버스 대신 컷아웃 이미지로 돌아갑니다.
    const onContextLost = () => {
      gsap.ticker.remove(tick);
      if (bakerRenderer) bakerRenderer.canvas.style.visibility = "hidden";
      setWebglReady(false);
    };

    import("../lib/baker-renderer")
      .then(({ createBakerRenderer }) => createBakerRenderer(CUTOUT, DEPTH))
      .then((created) => {
        // 텍스처를 받는 사이 컨텍스트를 잃었으면 빈 캔버스 대신 컷아웃 이미지를 그대로 둡니다.
        if (disposed || created.isContextLost()) {
          created.destroy();
          return;
        }
        bakerRenderer = created;
        created.canvas.setAttribute("aria-hidden", "true");
        created.canvas.addEventListener("webglcontextlost", onContextLost);
        host.appendChild(created.canvas);
        resize();
        setWebglReady(true);
        gsap.to(intro, { value: 1, duration: 1.6, ease: "power3.out", delay: 0.2 });
        gsap.ticker.add(tick);
      })
      .catch(() => setWebglReady(false));

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      observer.disconnect();
      gsap.ticker.remove(tick);
      gsap.killTweensOf(intro);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      bakerRenderer?.canvas.removeEventListener("webglcontextlost", onContextLost);
      bakerRenderer?.destroy();
      setWebglReady(false);
    };
  }, [enabled, finePointer]);

  // 마우스 시차와 스크롤 연출.
  useGsap(
    rootRef,
    ({ selector }) => {
      const select = selector ?? (() => []);
      const bakerEl = bakerRef.current;
      const floats = select("[data-float]") as HTMLElement[];
      const lines = select("[data-line]") as HTMLElement[];
      const [glowEl] = select("[data-glow]") as HTMLElement[];

      gsap.set(bakerEl, { xPercent: -50 });
      const bakerX = gsap.quickTo(bakerEl, "x", { duration: 1.1, ease: "power3" });
      const bakerRotY = gsap.quickTo(bakerEl, "rotationY", { duration: 1.1, ease: "power3" });
      const bakerRotX = gsap.quickTo(bakerEl, "rotationX", { duration: 1.1, ease: "power3" });
      const movers = floats.map((element) => ({
        depth: Number(element.dataset.depth),
        x: gsap.quickTo(element, "x", { duration: 1.3, ease: "power3" }),
        y: gsap.quickTo(element, "y", { duration: 1.3, ease: "power3" }),
      }));
      const lineMovers = lines.map((element, index) => ({
        x: gsap.quickTo(element, "x", { duration: 1.6, ease: "power3" }),
        direction: index === 0 ? -1 : 1,
      }));
      const glowX = glowEl ? gsap.quickTo(glowEl, "x", { duration: 0.9, ease: "power3" }) : null;
      const glowY = glowEl ? gsap.quickTo(glowEl, "y", { duration: 0.9, ease: "power3" }) : null;
      glowX?.(window.innerWidth / 2);
      glowY?.(window.innerHeight / 2);

      const onPointer = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        bakerX(nx * 46);
        bakerRotY(nx * 14);
        bakerRotX(-ny * 7);
        for (const mover of movers) {
          mover.x(-nx * 90 * mover.depth);
          mover.y(-ny * 70 * mover.depth);
        }
        for (const mover of lineMovers) mover.x(nx * 24 * mover.direction);
        glowX?.(event.clientX);
        glowY?.(event.clientY);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      gsap.from(lines, { yPercent: 110, duration: 1.5, ease: "expo.out", stagger: 0.12, delay: 0.1 });
      gsap.from(floats, {
        scale: 0.2,
        autoAlpha: 0,
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.07,
        delay: 0.3,
      });

      const scroll = gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom bottom", scrub: 0.7 },
      });
      scroll
        .to(lines[0] ?? {}, { xPercent: -12, opacity: 0.15, ease: "none" }, 0)
        .to(lines[1] ?? {}, { xPercent: 12, opacity: 0.15, ease: "none" }, 0)
        .to(bakerEl, { scale: 1.28, yPercent: 5, ease: "none" }, 0);
      floats.forEach((element, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        scroll.to(
          element,
          {
            xPercent: side * 180 * Number(element.dataset.depth),
            yPercent: -60 - 90 * Number(element.dataset.depth),
            rotation: side * 16,
            ease: "none",
          },
          0,
        );
      });
      return () => window.removeEventListener("pointermove", onPointer);
    },
    enabled,
  );

  return (
    <div ref={rootRef} id="intro" className={wrapper}>
      <div className={stage}>
        <div data-glow aria-hidden="true" className={glow} />
        <div className={heading}>
          <SectionHeading
            index={1}
            after={
              <span className={scrollCueBox}>
                <ScrollCue label={t("scroll")} />
              </span>
            }
          >
            <h1 className={title} lang="en" aria-label="Dessert Land">
              <span aria-hidden="true" className={css({ overflow: "clip" })}>
                <span data-line className={titleLine}>
                  Dessert
                </span>
              </span>
              <span aria-hidden="true" className={css({ overflow: "clip" })}>
                <span data-line className={titleLine}>
                  Land
                </span>
              </span>
            </h1>
          </SectionHeading>
        </div>
        {FLOATS.filter((item) => !item.front).map((item) => (
          <FloatCard key={item.slug} {...item} />
        ))}
        <div
          ref={bakerRef}
          data-baker
          className={baker}
          style={{ aspectRatio: `${CUTOUT_RATIO * 1.14}`, transform: "translateX(-50%)" }}
        >
          <Image
            unoptimized
            ref={fallbackRef}
            src={CUTOUT}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 90vw, 60vw"
            className={bakerFallback}
            style={{ visibility: webglReady ? "hidden" : "visible" }}
          />
        </div>
        {FLOATS.filter((item) => item.front).map((item) => (
          <FloatCard key={item.slug} {...item} />
        ))}
        <div className={copy}>
          <div className={copyPanel}>
            <p className={eyebrow}>{t("eyebrow")}</p>
            <p className={tagline}>{t("tagline")}</p>
          </div>
          <div className={actions}>
            <Link href="/shop" className={buttonRecipe()} data-magnetic>
              {t("cta")}
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type FloatCardProps = (typeof FLOATS)[number];

function FloatCard({ slug, top, left, width, depth, wide }: FloatCardProps) {
  const product = getProduct(slug);
  if (!product) return null;
  return (
    <div
      data-float
      data-depth={depth}
      aria-hidden="true"
      className={cx(float, wide && floatWide)}
      style={{ top, left, width }}
    >
      <Image unoptimized src={product.image.src} alt="" fill sizes="20vw" className={floatImage} />
    </div>
  );
}
