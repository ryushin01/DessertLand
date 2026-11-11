"use client";

import { useRef, type ElementType } from "react";
import { css } from "styled-system/css";

import { gsap, useGsap } from "@/shared/lib/motion/gsap";
import { useMotionEnabled } from "@/shared/lib/motion";

const clip = css({ display: "inline-block", overflow: "clip", verticalAlign: "bottom" });
const char = css({ display: "inline-block", willChange: "transform" });
const hidden = css({ srOnly: true });

type RevealTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** 스크롤 없이 바로 재생합니다. */
  immediate?: boolean;
  id?: string;
};

/** 글자를 가면 아래에서 올리는 제목입니다. 스크린 리더는 원문만 읽습니다. */
export function RevealText({ text, as: Tag = "span", className, immediate, id }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const enabled = useMotionEnabled();

  useGsap(
    ref,
    ({ selector }) => {
      const chars = selector?.("[data-char]") ?? [];
      gsap.from(chars, {
        yPercent: 115,
        rotate: 6,
        duration: 1.1,
        ease: "expo.out",
        stagger: { each: 0.025, from: "start" },
        ...(immediate
          ? {}
          : { scrollTrigger: { trigger: ref.current, start: "top 88%", once: true } }),
      });
    },
    enabled,
    [text, immediate],
  );

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className} id={id}>
      <span className={hidden}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <span key={`${word}-${wordIndex}`}>
            <span className={clip}>
              {Array.from(word).map((letter, letterIndex) => (
                <span key={letterIndex} data-char className={char}>
                  {letter}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
