"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

import { cartCountAtom, cartOpenAtom } from "@/entities/cart";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MotionToggle } from "./MotionToggle";
import { Link } from "@/shared/i18n";
import { Icon, Logo } from "@/shared/ui";

const header = css({
  position: "fixed",
  insetBlockStart: 0,
  insetInline: 0,
  zIndex: 50,
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "start",
  gap: "12px",
  paddingBlock: { base: "14px", md: "28px" },
  paddingInline: { base: "16px", md: "56px" },
  background: "linear-gradient(to bottom, rgba(0, 2, 14, 0.85), rgba(0, 2, 14, 0))",
});
// 레퍼런스의 좌상단 메뉴 단추처럼 아이콘 아래 붉은 짧은 선과 넓은 자간의 라벨을 둡니다.
const brand = css({
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  minHeight: "44px",
  justifySelf: "start",
});
const brandLabel = css({
  position: "relative",
  paddingBlockStart: "8px",
  fontSize: "0.68rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  _before: {
    content: '""',
    position: "absolute",
    insetBlockStart: 0,
    insetInlineStart: "calc(50% - 1em)",
    width: "2em",
    borderBlockStart: "1px solid {colors.signal}",
  },
});
const nav = css({ display: "flex", alignItems: "center", gap: { base: "2px", md: "10px" } });
const navLink = css({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "44px",
  paddingInline: "0.9em",
  fontSize: "0.75rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  borderRadius: "0",
  _hover: { background: "rgba(255, 255, 255, 0.16)" },
});
const cartButton = css({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  borderRadius: "0",
  cursor: "pointer",
  fontSize: "1.05rem",
  _hover: { background: "rgba(255, 255, 255, 0.16)" },
});
const badge = css({
  position: "absolute",
  insetBlockStart: "2px",
  insetInlineEnd: "0",
  minWidth: "18px",
  height: "18px",
  paddingInline: "4px",
  display: "grid",
  placeItems: "center",
  borderRadius: "0",
  background: "strawberry",
  color: "cocoa.950",
  fontSize: "0.68rem",
  fontWeight: "700",
});

export function SiteHeader() {
  const t = useTranslations("nav");
  const count = useAtomValue(cartCountAtom);
  const setOpen = useSetAtom(cartOpenAtom);

  return (
    <header className={header}>
      <Link href="/" className={brand} aria-label={t("home")} data-cursor="">
        <Logo size={40} />
        <span aria-hidden="true" lang="en" className={brandLabel}>
          Dessert Land
        </span>
      </Link>
      <nav aria-label={t("main")} className={nav}>
        <Link href="/shop" className={navLink}>
          {t("shop")}
        </Link>
        <LocaleSwitcher />
        <MotionToggle />
        <button
          type="button"
          className={cartButton}
          aria-label={count > 0 ? t("cartWithCount", { count }) : t("cart")}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Icon name="shopping-bag" />
          {count > 0 ? (
            <span aria-hidden="true" className={badge}>
              {count}
            </span>
          ) : null}
        </button>
      </nav>
    </header>
  );
}
