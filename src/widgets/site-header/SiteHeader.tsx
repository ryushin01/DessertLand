"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { css } from "styled-system/css";

import { cartCountAtom, cartOpenAtom } from "@/entities/cart";
import { LocaleSwitcher } from "@/features/change-locale";
import { MotionToggle } from "@/features/toggle-motion";
import { Link } from "@/shared/i18n";
import { Icon } from "@/shared/ui";

const header = css({
  position: "fixed",
  insetBlockStart: 0,
  insetInline: 0,
  zIndex: 50,
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "12px",
  paddingBlock: "12px",
  paddingInline: { base: "16px", md: "28px" },
  background: "linear-gradient(to bottom, rgba(18, 11, 10, 0.78), rgba(18, 11, 10, 0))",
});
const brand = css({
  display: "inline-flex",
  flexDirection: "column",
  lineHeight: "1.05",
  minHeight: "44px",
  justifyContent: "center",
});
const brandTop = css({ fontSize: "0.72rem", letterSpacing: "0.02em" });
const brandMain = css({ fontFamily: "display", fontSize: "1.45rem" });
const nav = css({ display: "flex", alignItems: "center", gap: { base: "2px", md: "10px" } });
const navLink = css({
  display: { base: "none", sm: "inline-flex" },
  alignItems: "center",
  minHeight: "44px",
  paddingInline: "0.8em",
  fontSize: "0.85rem",
  borderRadius: "999px",
  _hover: { background: "rgba(247, 236, 223, 0.16)" },
});
const cartButton = css({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "1.05rem",
  _hover: { background: "rgba(247, 236, 223, 0.16)" },
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
  borderRadius: "999px",
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
        <span className={brandTop} lang="en">
          Dessert
        </span>
        <span className={brandMain} lang="en">
          Market
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
