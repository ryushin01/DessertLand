"use client";

import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import { gsap } from "@/shared/lib/motion/gsap";
import { useMediaQuery, useMotionEnabled } from "@/shared/lib/motion";

const canvas = css({
  position: "fixed",
  inset: 0,
  zIndex: 80,
  pointerEvents: "none",
});
const dot = css({
  position: "fixed",
  insetBlockStart: 0,
  insetInlineStart: 0,
  zIndex: 82,
  width: "8px",
  height: "8px",
  marginBlockStart: "-4px",
  marginInlineStart: "-4px",
  borderRadius: "999px",
  background: "cream",
  pointerEvents: "none",
  mixBlendMode: "difference",
});
const ring = css({
  position: "fixed",
  insetBlockStart: 0,
  insetInlineStart: 0,
  zIndex: 81,
  width: "44px",
  height: "44px",
  marginBlockStart: "-22px",
  marginInlineStart: "-22px",
  display: "grid",
  placeItems: "center",
  borderRadius: "999px",
  border: "1px solid {colors.cream}",
  color: "cocoa.950",
  fontSize: "0.2rem",
  pointerEvents: "none",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

const COLORS = ["#ff6484", "#f2b267", "#b9d98b", "#f7ecdf", "#8fc7ff", "#c79bff"];

type Sprinkle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  color: string;
  life: number;
};

/** 마우스를 따라오는 링과 흩날리는 스프링클입니다. 정밀 포인터에서만 동작합니다. */
export function CustomCursor() {
  const motion = useMotionEnabled();
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const enabled = motion && fine;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvasEl = canvasRef.current;
    const dotEl = dotRef.current;
    const ringEl = ringRef.current;
    const labelEl = labelRef.current;
    const context = canvasEl?.getContext("2d");
    if (!canvasEl || !dotEl || !ringEl || !labelEl || !context) return;

    document.documentElement.dataset.customCursor = "on";
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      canvasEl.width = window.innerWidth * dpr;
      canvasEl.height = window.innerHeight * dpr;
    };
    resize();

    gsap.set([dotEl, ringEl], { x: -100, y: -100 });
    const ringX = gsap.quickTo(ringEl, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: 0.45, ease: "power3" });
    const dotX = gsap.quickSetter(dotEl, "x", "px");
    const dotY = gsap.quickSetter(dotEl, "y", "px");

    const sprinkles: Sprinkle[] = [];
    let lastX = 0;
    let lastY = 0;
    let magnet: HTMLElement | null = null;

    const onMove = (event: PointerEvent) => {
      const { clientX: x, clientY: y } = event;
      dotX(x);
      dotY(y);
      ringX(x);
      ringY(y);

      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance > 14 && sprinkles.length < 120) {
        lastX = x;
        lastY = y;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#f7ecdf";
        sprinkles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -1 - Math.random() * 1.6,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.3,
          color,
          life: 1,
        });
      }

      const target = event.target instanceof Element ? event.target : null;
      const cursorHost = target?.closest<HTMLElement>("[data-cursor]");
      const label = cursorHost?.dataset.cursor ?? "";
      if (labelEl.textContent !== label) labelEl.textContent = label;
      const interactive = target?.closest("a, button, summary, label, input");
      gsap.to(ringEl, {
        scale: label ? 2.4 : interactive ? 1.5 : 1,
        backgroundColor: label ? "#f7ecdf" : "rgba(247, 236, 223, 0)",
        duration: 0.35,
        overwrite: "auto",
      });
      gsap.to(labelEl, { fontSize: label ? 5.4 : 0, duration: 0.2, overwrite: "auto" });

      const nextMagnet = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magnet && magnet !== nextMagnet) {
        gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      }
      magnet = nextMagnet;
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        gsap.to(magnet, {
          x: (x - rect.left - rect.width / 2) * 0.3,
          y: (y - rect.top - rect.height / 2) * 0.4,
          duration: 0.4,
          overwrite: "auto",
        });
      }
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let index = sprinkles.length - 1; index >= 0; index -= 1) {
        const sprinkle = sprinkles[index];
        if (!sprinkle) continue;
        sprinkle.vy += 0.09;
        sprinkle.x += sprinkle.vx;
        sprinkle.y += sprinkle.vy;
        sprinkle.rotation += sprinkle.spin;
        sprinkle.life -= 0.016;
        if (sprinkle.life <= 0) {
          sprinkles.splice(index, 1);
          continue;
        }
        context.save();
        context.globalAlpha = Math.min(1, sprinkle.life * 1.6);
        context.translate(sprinkle.x, sprinkle.y);
        context.rotate(sprinkle.rotation);
        context.fillStyle = sprinkle.color;
        context.beginPath();
        context.roundRect(-6, -2, 12, 4, 2);
        context.fill();
        context.restore();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    gsap.ticker.add(draw);

    return () => {
      delete document.documentElement.dataset.customCursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      gsap.ticker.remove(draw);
      if (magnet) gsap.set(magnet, { x: 0, y: 0 });
      gsap.killTweensOf([ringEl, labelEl]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true">
      <canvas ref={canvasRef} className={canvas} />
      <div ref={ringRef} className={ring}>
        <span ref={labelRef} />
      </div>
      <div ref={dotRef} className={dot} />
    </div>
  );
}
