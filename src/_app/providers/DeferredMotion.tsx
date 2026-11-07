"use client";

import dynamic from "next/dynamic";

import { useMediaQuery } from "@/shared/lib/motion";

const SmoothScroll = dynamic(
  () => import("@/widgets/smooth-scroll").then((module) => module.SmoothScroll),
  { ssr: false },
);
const CustomCursor = dynamic(
  () => import("@/widgets/custom-cursor").then((module) => module.CustomCursor),
  { ssr: false },
);

/**
 * 부드러운 스크롤과 커서는 정밀 포인터에서만 의미가 있습니다.
 * 첫 화면을 막지 않도록 나중에 받고, 터치 기기에서는 코드 자체를 받지 않습니다.
 */
export function DeferredMotion() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  if (!finePointer) return null;
  return (
    <>
      <SmoothScroll />
      <CustomCursor />
    </>
  );
}
