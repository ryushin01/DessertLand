"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";

import { LOCALES, LOCALE_LABELS, Link, usePathname, type Locale } from "@/shared/i18n";
import { Icon } from "@/shared/ui";

const root = css({ position: "relative" });
const summary = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5em",
  minHeight: "44px",
  paddingInline: "0.7em",
  borderRadius: "999px",
  cursor: "pointer",
  listStyle: "none",
  fontSize: "0.85rem",
  _hover: { background: "rgba(247, 236, 223, 0.16)" },
  "&::-webkit-details-marker": { display: "none" },
});
const menu = css({
  position: "absolute",
  insetBlockStart: "calc(100% + 8px)",
  insetInlineEnd: 0,
  width: "max-content",
  minWidth: "180px",
  padding: "8px",
  borderRadius: "16px",
  background: "cocoa.900",
  border: "1px solid {colors.cocoa.700}",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
});
const item = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1em",
  minHeight: "40px",
  paddingInline: "12px",
  borderRadius: "10px",
  fontSize: "0.9rem",
  _hover: { background: "cocoa.800" },
  "&[aria-current=true]": { color: "caramel" },
});

export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  // useSearchParams는 정적 페이지 전체를 동적으로 바꾸므로, 메뉴를 열 때 주소에서 읽습니다.
  const [query, setQuery] = useState<Record<string, string>>({});

  useEffect(() => {
    const close = (event: Event) => {
      const details = ref.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
        return;
      }
      if (!details.contains(event.target as Node)) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details
      ref={ref}
      className={root}
      // 초점이 밖으로 나가면 닫아, 다시 열 때 항상 현재 주소를 읽게 합니다.
      // 일부 브라우저는 링크를 클릭할 때 relatedTarget이 비어 있으므로 그때는 닫지 않습니다.
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && !event.currentTarget.contains(next)) {
          event.currentTarget.open = false;
        }
      }}
      onToggle={(event) => {
        if (!event.currentTarget.open) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("canceled");
        setQuery(Object.fromEntries(params));
      }}
    >
      <summary className={summary} aria-label={`${t("language")}: ${LOCALE_LABELS[locale]}`}>
        <Icon name="globe" />
        <span aria-hidden="true">{locale.toUpperCase()}</span>
      </summary>
      <ul className={menu}>
        {LOCALES.map((code) => (
          <li key={code}>
            <Link
              href={{ pathname, query }}
              locale={code}
              lang={code}
              hrefLang={code}
              className={item}
              aria-current={code === locale ? "true" : undefined}
            >
              {LOCALE_LABELS[code]}
              {code === locale ? <Icon name="check" /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
