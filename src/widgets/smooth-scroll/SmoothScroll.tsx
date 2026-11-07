"use client";

import Lenis from "lenis";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

import { gsap, motionPausedAtom, ScrollTrigger, setLenis, useMotionEnabled } from "@/shared/lib/motion";

/** Lenis와 ScrollTrigger를 한 박자로 맞추고, 움직임 상태를 html에 표시합니다. */
export function SmoothScroll() {
  const enabled = useMotionEnabled();
  const paused = useAtomValue(motionPausedAtom);

  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? "on" : "off";
  }, [enabled, paused]);

  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ lerp: 0.1 });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [enabled]);

  return null;
}
