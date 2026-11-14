import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

import { LOCALES, LOCALE_LABELS, Link } from "@/shared/i18n";

const footer = css({
  position: "relative",
  overflow: "clip",
  borderBlockStart: "1px solid {colors.cocoa.700}",
  paddingBlockEnd: "32px",
});
const marquee = css({ display: "flex", width: "max-content", paddingBlock: "32px" });
const marqueeTrack = css({
  display: "flex",
  flexShrink: 0,
  animation: "marquee 30s linear infinite",
  _motionOff: { animation: "none" },
});
const marqueeItem = css({
  fontFamily: "display",
  fontSize: "clamp(4rem, 14vw, 13rem)",
  lineHeight: "1",
  paddingInlineEnd: "0.4em",
  whiteSpace: "nowrap",
});
const grid = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "2fr 1fr 1fr" },
  gap: "28px",
  paddingInline: { base: "16px", md: "28px" },
  fontSize: "0.9rem",
  lineHeight: "1.6",
});
const list = css({ display: "flex", flexWrap: "wrap", gap: "4px 14px" });
const link = css({
  display: "inline-block",
  paddingBlock: "4px",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  _hover: { color: "caramel" },
});
const SOURCES_URL = "https://github.com/ryushin01/DessertLand#출처";
const FLATICON_URL = "https://www.flaticon.com/uicons";
/** 앱과 함께 배포한 Storybook. 개발 서버에는 빌드 결과물이 없어 Storybook 개발 서버로 보냅니다. */
const storybook =
  process.env.NODE_ENV === "development" ? "http://localhost:6006" : "/storybook/index.html";

export function SiteFooter() {
  const t = useTranslations("footer");
  const words = [
    "Milkshake",
    "Cheesecake",
    "Muffin",
    "Pancake",
    "Cream Cake",
    "Tiramisù",
    "Baklava",
  ];

  return (
    <footer className={footer}>
      <div aria-hidden="true" className={marquee}>
        {[0, 1].map((copy) => (
          <div key={copy} className={marqueeTrack}>
            {words.map((word) => (
              <span key={word} className={marqueeItem}>
                {word}
                {" — "}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className={grid}>
        <p>{t("tagline")}</p>
        <ul className={list}>
          {LOCALES.map((code) => (
            <li key={code}>
              <Link
                href="/"
                locale={code}
                lang={code}
                hrefLang={code}
                className={link}
                prefetch={false}
              >
                {LOCALE_LABELS[code]}
              </Link>
            </li>
          ))}
        </ul>
        <ul>
          <li>
            {/* 사진·아이콘·글꼴의 출처는 화면이 아니라 README에 적고, 여기서 그 표로 잇습니다. */}
            <a href={SOURCES_URL} className={link}>
              {t("credits")}
            </a>
          </li>
          <li>
            {/* Flaticon 무료 라이선스는 사이트 바닥글에 출처 줄을 두도록 정해 화면에 남깁니다. */}
            <a href={FLATICON_URL} className={link} rel="noreferrer" lang="en">
              Uicons by Flaticon
            </a>
          </li>
          <li>
            <a href={storybook} className={link} lang="en">
              Design system (Storybook)
            </a>
          </li>
          <li>
            <a href="https://unsplash.com" className={link} rel="noreferrer" lang="en">
              Photos from Unsplash
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
