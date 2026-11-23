"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { css } from "styled-system/css";

const list = css({
  display: { base: "none", md: "flex" },
  position: "fixed",
  zIndex: 40,
  insetInlineEnd: "44px",
  insetBlockStart: "50%",
  transform: "translateY(-50%)",
  flexDirection: "column",
  gap: "4px",
});
// 레퍼런스의 오른쪽 섹션 표시기: 지금 섹션은 속이 찬 원, 나머지는 테두리 원. 누르는 영역은 28px입니다.
const link = css({
  position: "relative",
  display: "grid",
  placeItems: "center",
  width: "28px",
  height: "28px",
  color: "cream",
  // 사진 위에서도 점이 보이도록 남색 그림자를 둡니다.
  filter: "drop-shadow(0 0 2px rgba(0, 2, 14, 0.9))",
  _before: {
    content: '""',
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    border: "1.5px solid currentColor",
    transition: "background 0.4s, transform 0.4s",
  },
  _hover: { _before: { transform: "scale(1.4)" } },
  "&[aria-current=true]::before": { background: "currentColor" },
});
// 마우스를 올리거나 키보드로 고르면 왼쪽에 섹션 이름을 보여 줍니다(툴팁).
const tip = css({
  position: "absolute",
  insetInlineEnd: "calc(100% + 10px)",
  whiteSpace: "nowrap",
  fontSize: "0.7rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  padding: "4px 8px",
  background: "rgba(0, 2, 14, 0.85)",
  opacity: 0,
  transform: "translateX(6px)",
  transition: "opacity 0.3s, transform 0.3s",
  pointerEvents: "none",
  "a:hover > &, a:focus-visible > &": { opacity: 1, transform: "translateX(0)" },
});

const SECTIONS = ["intro", "categories", "zoom", "world", "advisor", "trail"] as const;

/** 홈 화면 오른쪽의 세로 점 내비게이션. 각 점은 그 섹션으로 가는 링크이고, 지금 보고 있는 섹션을 표시합니다. */
export function SectionDots() {
  const tNav = useTranslations("nav");
  const tShowcase = useTranslations("showcase");
  const tZoom = useTranslations("zoom");
  const tWorld = useTranslations("world");
  const tAdvisor = useTranslations("advisor");
  const tTrail = useTranslations("trail");
  const [current, setCurrent] = useState<string>("intro");
  const labels: Record<(typeof SECTIONS)[number], string> = {
    intro: tNav("home"),
    categories: tShowcase("label"),
    zoom: tZoom("title"),
    world: tWorld("title"),
    advisor: tAdvisor("title"),
    trail: tTrail("title"),
  };

  useEffect(() => {
    // 화면 세로 가운데를 지나는 섹션을 지금 섹션으로 봅니다.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const id of SECTIONS) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <ol className={list}>
      {SECTIONS.map((id) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className={link}
            aria-label={labels[id]}
            aria-current={current === id ? "true" : undefined}
          >
            <span aria-hidden="true" className={tip}>
              {labels[id]}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
