"use client";

import { useEffect } from "react";

import { useMotionEnabled } from "@/shared/lib/motion";

/** CSS가 움직임 상태를 알 수 있도록 html에 표시합니다. */
export function MotionAttribute() {
  const enabled = useMotionEnabled();
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? "on" : "off";
  }, [enabled]);
  return null;
}
