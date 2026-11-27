"use client";

import { useEffect, useRef } from "react";

import styles from "./AdminCursor.module.css";

const INTERACTIVE = "a, button, input, select, textarea, label, summary, [role='button']";

/**
 * 마우스를 따라오는 붉은 테두리 원(사용자가 준 레퍼런스 첫 화면 스크린샷의 커서). 장식이라 화면 읽기에서 빼고,
 * 기본 커서와 초점 표시는 그대로 둡니다. 정밀 포인터(마우스)에서만 켜고, 움직임 줄이기 설정이면 끕니다.
 */
export function AdminCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ref.current;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!ring || !fine.matches || reduced.matches) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      ring.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      ring.dataset.visible = "true";
      ring.dataset.active = String(
        event.target instanceof Element && event.target.closest(INTERACTIVE) !== null,
      );
    };
    const onLeave = () => {
      ring.dataset.visible = "false";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true" data-visible="false">
      <span className={styles.ring} />
    </div>
  );
}
