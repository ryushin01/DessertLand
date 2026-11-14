"use client";

import { useAtomValue } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useEffect, useState } from "react";

const storage = createJSONStorage<boolean>(() => localStorage);

/** 여러 화면이 쓰는 미디어 쿼리. 문자열을 한곳에서 관리합니다. */
export const MEDIA = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  /** 마우스처럼 가리킬 수 있는 정밀한 포인터. 커서·자석 효과는 이때만 켭니다. */
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
} as const;

/** 움직임 멈춤 설정을 저장하는 키. 첫 그림 전에 읽는 곳(인트로 막)도 같은 키를 씁니다. */
export const MOTION_PAUSED_KEY = "dessert-land.motion-paused";

/** KWCAG 6.2.2: 움직임을 사용자가 멈출 수 있게 합니다. */
export const motionPausedAtom = atomWithStorage(MOTION_PAUSED_KEY, false, storage);

function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA.reducedMotion);
}

export function useMotionEnabled(): boolean {
  const paused = useAtomValue(motionPausedAtom);
  const reduced = usePrefersReducedMotion();
  return !paused && !reduced;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);
    sync();
    list.addEventListener("change", sync);
    return () => list.removeEventListener("change", sync);
  }, [query]);
  return matches;
}
