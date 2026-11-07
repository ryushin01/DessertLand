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
const external = "https://www.flaticon.com/uicons";

export function SiteFooter() {
  const t = useTranslations("footer");
  const words = ["Milkshake", "Cheesecake", "Muffin", "Pancake", "Cream Cake", "Tiramisù", "Baklava"];

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
            <Link href="/credits" className={link}>
              {t("credits")}
            </Link>
          </li>
          <li>
            <a href={external} className={link} rel="noreferrer" lang="en">
              Uicons by Flaticon
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
