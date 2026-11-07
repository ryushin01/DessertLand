import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** 부드러운 스크롤이 꺼져 있으면 일반 스크롤로 이동합니다. */
export function scrollToY(y: number): void {
  if (instance) instance.scrollTo(y, { duration: 0.8 });
  else window.scrollTo({ top: y });
}
