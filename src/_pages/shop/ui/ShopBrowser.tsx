"use client";

import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { css } from "styled-system/css";

import {
  ALLERGENS,
  TASTES,
  countryName,
  type Allergen,
  type Product,
  type Taste,
} from "@/entities/product";
import { Link } from "@/shared/i18n";

import { NO_FILTERS, filterProducts, hasFilters, type ShopFilters } from "../model/filter-products";
import { ProductScroller } from "./ProductScroller";
import { pill, pillList } from "./pill";

const area = css({
  position: "relative",
  zIndex: 2,
  display: "grid",
  gap: "20px",
  paddingBlockStart: "20px",
  paddingInline: { base: "16px", md: "56px" },
});
const field = css({ display: "grid", gap: "8px", maxWidth: "28rem" });
const label = css({ fontSize: "0.9rem", fontWeight: "500" });
const search = css({
  width: "100%",
  minHeight: "48px",
  paddingInline: "18px",
  borderRadius: "0",
  border: "1px solid {colors.muted}",
  background: "cocoa.950",
  color: "cream",
  fontSize: "1rem",
});
const groups = css({ display: "flex", flexWrap: "wrap", gap: "16px 32px" });
const group = css({ display: "grid", gap: "8px" });
const empty = css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" });
const advisorLink = css({
  display: "inline-block",
  paddingBlock: "8px",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  _hover: { color: "caramel" },
});

const toggle = <T,>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

type ShopBrowserProps = {
  products: Product[];
  /** 목록 상품들의 맛(slug → 맛). 맛 표는 서버에만 있어 서버가 골라 넘깁니다. */
  tastesBySlug: Record<string, readonly Taste[]>;
  categoryKey: string;
};

/** 이름·나라 찾기, 맛 고르기, 빼고 싶은 성분으로 목록을 좁힙니다. 주소는 바꾸지 않아 목록 페이지는 정적으로 남습니다. */
export function ShopBrowser({ products, tastesBySlug, categoryKey }: ShopBrowserProps) {
  const t = useTranslations("shop");
  const tAdvisor = useTranslations("advisor");
  const tAllergens = useTranslations("allergens");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const [filters, setFilters] = useState<ShopFilters>(NO_FILTERS);
  // 입력하는 동안 목록 다시 그리기가 글자 입력을 막지 않게 합니다.
  const deferred = useDeferredValue(filters);

  const visible = useMemo(
    () =>
      filterProducts(products, deferred, {
        name: (slug) => tProducts(`${slug}.name` as Parameters<typeof tProducts>[0]) as string,
        country: (product) => countryName(product.country, locale),
        tastes: (slug) => tastesBySlug[slug] ?? [],
      }),
    [products, deferred, tProducts, locale, tastesBySlug],
  );
  const listKey = `${categoryKey}|${deferred.query.trim()}|${deferred.tastes.join()}|${deferred.excluded.join()}`;

  return (
    <>
      <div className={area}>
        <div className={field}>
          <label htmlFor="shop-search" className={label}>
            {t("searchLabel")}
          </label>
          <input
            id="shop-search"
            type="search"
            className={search}
            value={filters.query}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
          />
        </div>
        <div className={groups}>
          <div role="group" aria-labelledby="shop-taste-label" className={group}>
            <p id="shop-taste-label" className={label}>
              {t("tasteFilter")}
            </p>
            <ul className={pillList}>
              {TASTES.map((taste: Taste) => (
                <li key={taste}>
                  <button
                    type="button"
                    className={pill}
                    aria-pressed={filters.tastes.includes(taste)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        tastes: toggle(current.tastes, taste),
                      }))
                    }
                  >
                    {tAdvisor(`chips.${taste}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div role="group" aria-labelledby="shop-allergen-label" className={group}>
            <p id="shop-allergen-label" className={label}>
              {t("allergenFilter")}
            </p>
            <ul className={pillList}>
              {ALLERGENS.map((allergen: Allergen) => (
                <li key={allergen}>
                  <button
                    type="button"
                    className={pill}
                    aria-pressed={filters.excluded.includes(allergen)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        excluded: toggle(current.excluded, allergen),
                      }))
                    }
                  >
                    {tAllergens(allergen)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p role="status">{t("results", { count: visible.length })}</p>
        {visible.length === 0 ? (
          <div className={empty}>
            <p>{t("noResults")}</p>
            {hasFilters(filters) ? (
              <button type="button" className={pill} onClick={() => setFilters(NO_FILTERS)}>
                {t("reset")}
              </button>
            ) : null}
          </div>
        ) : null}
        <p>
          <Link href="/#advisor" className={advisorLink}>
            {tAdvisor("shopLink")}
          </Link>
        </p>
      </div>
      <ProductScroller key={listKey} products={visible} />
    </>
  );
}
