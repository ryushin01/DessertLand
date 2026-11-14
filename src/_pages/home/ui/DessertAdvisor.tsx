"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { css, cx } from "styled-system/css";

import { countryName, formatProductPrice, getProduct } from "@/entities/product";
import { AddToCartButton } from "@/features/add-to-cart";
import {
  MAX_QUERY_LENGTH,
  TASTE_CHIPS,
  useRecommendation,
  type RecommendedPick,
  type TasteChip,
} from "@/features/recommend-dessert";
import { Link } from "@/shared/i18n";
import { Button, Icon } from "@/shared/ui";

const section = css({
  position: "relative",
  zIndex: 2,
  background: "cocoa.900",
  scrollMarginBlockStart: "72px",
  paddingBlock: { base: "72px", md: "120px" },
  paddingInline: { base: "16px", md: "28px" },
});
const inner = css({ maxWidth: "1200px", marginInline: "auto", display: "grid", gap: "32px" });
const title = css({
  fontFamily: "display",
  fontSize: "clamp(2.8rem, 7vw, 6.6rem)",
  lineHeight: "1",
  wordBreak: "var(--word-break)",
});
const lede = css({
  fontSize: "1.1rem",
  lineHeight: "1.6",
  maxWidth: "40rem",
  wordBreak: "var(--word-break)",
});
const form = css({ display: "grid", gap: "16px" });
const label = css({ fontSize: "0.95rem", fontWeight: "500" });
const field = css({ display: "grid", gap: "8px" });
const textarea = css({
  width: "100%",
  minHeight: "96px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid {colors.muted}",
  background: "cocoa.950",
  color: "cream",
  fontSize: "1.05rem",
  lineHeight: "1.5",
  resize: "vertical",
});
const hint = css({ fontSize: "0.85rem", color: "muted" });
const chips = css({ display: "flex", flexWrap: "wrap", gap: "8px", border: "none" });
const chipLegend = css({ fontSize: "0.95rem", fontWeight: "500", marginBlockEnd: "8px" });
const chip = css({
  minHeight: "44px",
  paddingInline: "16px",
  borderRadius: "999px",
  border: "1px solid {colors.muted}",
  cursor: "pointer",
  fontSize: "0.92rem",
  transition: "background 0.2s, color 0.2s",
  _hover: { background: "cocoa.800" },
  "&[aria-pressed=true]": { background: "cream", color: "cocoa.950", borderColor: "cream" },
});
const actions = css({ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" });
const message = css({
  padding: "14px 16px",
  border: "2px solid {colors.strawberry}",
  borderRadius: "12px",
  lineHeight: "1.5",
});
const srOnly = css({ srOnly: true });
const intro = css({ fontSize: "1.2rem", lineHeight: "1.55", wordBreak: "var(--word-break)" });
const badge = css({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  background: "cocoa.800",
  fontSize: "0.8rem",
  marginBlockEnd: "10px",
});
const list = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "repeat(3, minmax(0, 1fr))" },
  gap: "24px",
});
const card = css({
  display: "grid",
  gridTemplateRows: "auto 1fr",
  borderRadius: "12px",
  overflow: "hidden",
  background: "cocoa.950",
  animation: "advisorRise 0.6s {easings.silk}",
  _motionOff: { animation: "none" },
});
const photo = css({ position: "relative", display: "block", aspectRatio: "4 / 3" });
const cover = css({ objectFit: "cover" });
const cardBody = css({ display: "grid", gap: "10px", padding: "16px", alignContent: "start" });
const cardMeta = css({
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  fontSize: "0.85rem",
  color: "muted",
});
const cardName = css({
  fontFamily: "display",
  fontSize: "1.8rem",
  lineHeight: "1.15",
  textDecoration: "underline",
  textDecorationColor: "transparent",
  textUnderlineOffset: "4px",
  _hover: { textDecorationColor: "currentColor" },
});
const reason = css({ lineHeight: "1.55", wordBreak: "var(--word-break)" });
const notice = css({ fontSize: "0.85rem", color: "muted", lineHeight: "1.5" });
const placeholderCard = css({
  aspectRatio: "4 / 5",
  borderRadius: "12px",
  background: "cocoa.800",
  animation: "advisorPulse 1.4s ease-in-out infinite",
  _motionOff: { animation: "none" },
});

function PickCard({ pick }: { pick: RecommendedPick }) {
  const t = useTranslations("advisor");
  const tProducts = useTranslations("products");
  const tShop = useTranslations("shop");
  const locale = useLocale();
  const product = getProduct(pick.slug);
  if (!product) return null;
  const name = tProducts(`${product.slug}.name` as never) as string;
  return (
    <li className={card}>
      <Link href={`/shop/${product.slug}`} className={photo} tabIndex={-1} aria-hidden="true">
        <Image
          src={product.image.src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={cover}
        />
      </Link>
      <div className={cardBody}>
        <p className={cardMeta}>
          <span>{countryName(product.country, locale)}</span>
          <span>{formatProductPrice(product.priceUsd, locale)}</span>
        </p>
        <Link href={`/shop/${product.slug}`} className={cardName}>
          {name}
        </Link>
        <p className={reason}>{pick.reason}</p>
        <div>
          <AddToCartButton
            slug={product.slug}
            size="sm"
            tone="outline"
            accessibleName={tShop("add", { name })}
          >
            {t("add")}
          </AddToCartButton>
        </div>
      </div>
    </li>
  );
}

/** 입맛을 적으면 카탈로그 안에서 디저트를 골라 주는 추천 영역입니다. */
export function DessertAdvisor() {
  const t = useTranslations("advisor");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TasteChip[]>([]);
  const [emptyInput, setEmptyInput] = useState(false);
  const { status, intro: introText, picks, source, recommend } = useRecommendation();
  const loading = status === "loading";

  const toggle = (value: TasteChip) => {
    setEmptyInput(false);
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim() && selected.length === 0) {
      setEmptyInput(true);
      return;
    }
    setEmptyInput(false);
    void recommend({ query, chips: selected, locale });
  };

  return (
    <section id="advisor" className={section} aria-labelledby="advisor-title">
      <div className={inner}>
        <h2 id="advisor-title" className={title}>
          {t("title")}
        </h2>
        <p className={lede}>{t("lede")}</p>
        <form className={form} onSubmit={submit} noValidate>
          <div className={field}>
            <label htmlFor="advisor-query" className={label}>
              {t("label")}
            </label>
            <textarea
              id="advisor-query"
              name="query"
              className={textarea}
              value={query}
              maxLength={MAX_QUERY_LENGTH}
              placeholder={t("placeholder")}
              aria-describedby="advisor-hint"
              onChange={(event) => {
                setEmptyInput(false);
                setQuery(event.target.value);
              }}
            />
            <p id="advisor-hint" className={hint}>
              {t("hint", { max: MAX_QUERY_LENGTH })}
            </p>
          </div>
          <div role="group" aria-labelledby="advisor-chips">
            <p id="advisor-chips" className={chipLegend}>
              {t("chipsLabel")}
            </p>
            <div className={chips}>
              {TASTE_CHIPS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={chip}
                  aria-pressed={selected.includes(value)}
                  onClick={() => toggle(value)}
                >
                  {t(`chips.${value}`)}
                </button>
              ))}
            </div>
          </div>
          {emptyInput ? (
            <p role="alert" className={message}>
              {t("empty")}
            </p>
          ) : null}
          <div className={actions}>
            <Button type="submit" disabled={loading} aria-busy={loading} data-magnetic>
              <Icon name="check" />
              {loading ? t("loading") : t("submit")}
            </Button>
          </div>
        </form>

        {/* 글자가 흘러나올 때마다 읽지 않도록 시작과 끝만 알립니다. */}
        <p role="status" className={srOnly}>
          {status === "loading" ? t("loading") : null}
          {status === "done" ? t("resultCount", { count: picks.length }) : null}
        </p>

        {status === "error" ? (
          <p role="alert" className={message}>
            {t("error")}
          </p>
        ) : null}
        {status === "limited" ? (
          <p role="alert" className={message}>
            {t("limited")}
          </p>
        ) : null}

        {loading && picks.length === 0 && !introText ? (
          <div aria-hidden="true" className={list}>
            {[0, 1, 2].map((index) => (
              <div key={index} className={placeholderCard} />
            ))}
          </div>
        ) : null}

        {introText || picks.length > 0 ? (
          <div data-testid="advisor-results">
            {source ? (
              <p className={badge}>{source === "ai" ? t("sourceAi") : t("sourceBasic")}</p>
            ) : null}
            <p className={cx(intro, css({ marginBlockEnd: "24px" }))}>{introText}</p>
            {picks.length > 0 ? (
              <ul className={list}>
                {picks.map((pick) => (
                  <PickCard key={pick.slug} pick={pick} />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <p className={notice}>{t("notice")}</p>
      </div>
    </section>
  );
}
