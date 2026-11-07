"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import { gsap } from "@/shared/lib/motion";

const SEEN_KEY = "dessert-land.intro-seen";

const curtain = css({
  position: "fixed",
  inset: 0,
  zIndex: 70,
  display: "grid",
  placeItems: "end start",
  padding: { base: "16px", md: "28px" },
  background: "cocoa.950",
  color: "cream",
  pointerEvents: "none",
  // JS가 실패해도 화면을 가리지 않도록 CSS만으로도 사라집니다.
  animation: "curtainFallback 0.3s linear 4s forwards",
});
const counter = css({
  fontFamily: "display",
  fontSize: "clamp(5rem, 22vw, 20rem)",
  lineHeight: "0.9",
  fontVariantNumeric: "tabular-nums",
});

function shouldSkip(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  try {
    return (
      sessionStorage.getItem(SEEN_KEY) === "1" ||
      localStorage.getItem("dessert-land.motion-paused") === "true"
    );
  } catch {
    return false;
  }
}

/** 첫 방문에만 나오는 숫자 로더와 막이 열리는 전환입니다. */
export function IntroCurtain() {
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (shouldSkip()) {
      if (ref.current) ref.current.style.display = "none";
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // 저장이 막혀 있으면 다음 방문에 다시 재생될 뿐입니다.
    }
    const value = { count: 0 };
    const timeline = gsap.timeline({ onComplete: () => setDone(true) });
    timeline
      .to(value, {
        count: 100,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = String(Math.round(value.count)).padStart(3, "0");
          }
        },
      })
      .to(ref.current, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 1,
        ease: "expo.inOut",
      });
    return () => {
      timeline.kill();
    };
  }, []);

  if (done) return null;

  return (
    <div ref={ref} aria-hidden="true" className={curtain} style={{ clipPath: "inset(0 0 0 0)" }}>
      <span ref={counterRef} className={counter}>
        000
      </span>
    </div>
  );
}
