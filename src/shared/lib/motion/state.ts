"use client";

import { useAtomValue } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useEffect, useState } from "react";

const storage = createJSONStorage<boolean>(() => localStorage);

/** KWCAG 6.2.2: 움직임을 사용자가 멈출 수 있게 합니다. */
export const motionPausedAtom = atomWithStorage("dessert-world.motion-paused", false, storage);

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
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
