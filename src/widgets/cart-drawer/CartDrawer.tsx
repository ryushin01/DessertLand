"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

import {
  MAX_QUANTITY,
  cartAnnouncementAtom,
  cartLinesAtom,
  cartOpenAtom,
  removeLine,
  setLineQuantity,
} from "@/entities/cart";
import { formatMoney } from "@/entities/product";
import { useCartSummary } from "@/features/cart-summary";
import { Link } from "@/shared/i18n";
import { getLenis } from "@/shared/lib/motion";
import { Icon, QuantityStepper, buttonRecipe } from "@/shared/ui";

const dialog = css({
  position: "fixed",
  insetBlock: 0,
  insetInlineStart: "auto",
  insetInlineEnd: 0,
  margin: 0,
  width: "min(480px, 100vw)",
  maxWidth: "100vw",
  height: "100dvh",
  maxHeight: "100dvh",
  background: "cocoa.900",
  color: "cream",
  "&::backdrop": { background: "rgba(10, 6, 5, 0.65)", backdropFilter: "blur(6px)" },
  "&[open]": { animation: "drawerIn 0.5s {easings.silk}", display: "flex", flexDirection: "column" },
});
const head = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  borderBlockEnd: "1px solid {colors.cocoa.700}",
});
const title = css({ fontFamily: "display", fontSize: "2rem" });
const iconButton = css({
  display: "grid",
  placeItems: "center",
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  cursor: "pointer",
  _hover: { background: "cocoa.800" },
});
const body = css({ flex: 1, overflowY: "auto", padding: "8px 20px", overscrollBehavior: "contain" });
const row = css({
  display: "grid",
  gridTemplateColumns: "76px 1fr auto",
  gap: "14px",
  alignItems: "start",
  paddingBlock: "16px",
  borderBlockEnd: "1px solid {colors.cocoa.800}",
});
const thumb = css({ width: "76px", height: "76px", objectFit: "cover", borderRadius: "12px" });
const rowName = css({ fontSize: "0.98rem", marginBlockEnd: "8px" });
const foot = css({
  display: "grid",
  gap: "10px",
  padding: "16px 20px 20px",
  borderBlockStart: "1px solid {colors.cocoa.700}",
});
const line = css({ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" });
const total = css({ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "600" });
const empty = css({ paddingBlock: "48px", textAlign: "center", color: "muted" });
const live = css({ srOnly: true });

export function CartDrawer() {
  const t = useTranslations("cart");
  const tProducts = useTranslations("products");
  const tProduct = useTranslations("product");
  const locale = useLocale();
  const [open, setOpen] = useAtom(cartOpenAtom);
  const setLines = useSetAtom(cartLinesAtom);
  const announcement = useAtomValue(cartAnnouncementAtom);
  const summary = useCartSummary();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      getLenis()?.stop();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <>
      <p role="status" className={live}>
        {announcement}
      </p>
      <dialog
        ref={ref}
        className={dialog}
        aria-labelledby="cart-title"
        onClose={() => {
          setOpen(false);
          getLenis()?.start();
        }}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
      >
        <div className={head}>
          <h2 id="cart-title" className={title}>
            {t("title")}
          </h2>
          <button
            type="button"
            className={iconButton}
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          >
            <Icon name="cross" />
          </button>
        </div>
        <div className={body}>
          {summary.lines.length === 0 ? (
            <p className={empty}>{t("empty")}</p>
          ) : (
            <ul>
              {summary.lines.map(({ product, quantity, lineTotal }) => {
                const name = tProducts(
                  `${product.slug}.name` as Parameters<typeof tProducts>[0],
                ) as string;
                return (
                  <li key={product.slug} className={row}>
                    <Image
                      src={product.image.src}
                      alt=""
                      width={152}
                      height={152}
                      sizes="76px"
                      className={thumb}
                    />
                    <div>
                      <p className={rowName}>{name}</p>
                      <QuantityStepper
                        value={quantity}
                        max={MAX_QUANTITY}
                        label={`${tProduct("quantity")}: ${name}`}
                        decreaseLabel={tProduct("decrease")}
                        increaseLabel={tProduct("increase")}
                        onChange={(next) =>
                          setLines((lines) => setLineQuantity(lines, product.slug, next))
                        }
                      />
                    </div>
                    <div>
                      <p>{formatMoney(lineTotal, locale)}</p>
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={t("remove", { name })}
                        onClick={() => setLines((lines) => removeLine(lines, product.slug))}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {summary.lines.length > 0 ? (
          <div className={foot}>
            <p className={line}>
              <span>{t("subtotal")}</span>
              <span>{formatMoney(summary.subtotal, locale)}</span>
            </p>
            <p className={line}>
              <span>{t("shipping")}</span>
              <span>{formatMoney(summary.shipping, locale)}</span>
            </p>
            <p className={total}>
              <span>{t("total")}</span>
              <span>{formatMoney(summary.total, locale)}</span>
            </p>
            <Link href="/checkout" className={buttonRecipe()} onClick={() => setOpen(false)}>
              {t("checkout")}
              <Icon name="arrow-right" />
            </Link>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
