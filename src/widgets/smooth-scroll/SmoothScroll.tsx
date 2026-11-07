"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { setLenis, useMotionEnabled } from "@/shared/lib/motion";
import { ScrollTrigger, gsap } from "@/shared/lib/motion/gsap";

/** Lenis와 ScrollTrigger를 한 박자로 맞춥니다. */
export function SmoothScroll() {
  const enabled = useMotionEnabled();

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
