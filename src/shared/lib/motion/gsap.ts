"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type DependencyList, type RefObject } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/** gsap.context로 애니메이션을 묶어 언마운트나 의존성 변경 시 원래 상태로 되돌립니다. */
export function useGsap(
  scope: RefObject<HTMLElement | null>,
  setup: (context: gsap.Context) => void | (() => void),
  enabled: boolean,
  deps: DependencyList = [],
): void {
  useLayoutEffect(() => {
    if (!enabled || !scope.current) return;
    const context = gsap.context((self) => setup(self), scope.current);
    return () => context.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scope, ...deps]);
}
